"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ForceGraphMethods, LinkObject, NodeObject } from "react-force-graph-2d";
import * as d3 from "d3";
import SemiDonutChart from "./SemiDonutChart";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export type PeriodKey = "daily_timeline" | "weekly_timeline" | "monthly_timeline";
type NodeType = "legal" | "incident";

interface BaseNode extends NodeObject {
  id: string;
  type: NodeType;
  label: string;
  x?: number;
  y?: number;
}

interface LegalNode extends BaseNode {
  type: "legal";
  totalCount: number;
  description?: string;
}

interface CountsBy {
  agree: number;
  repeal: number;
  neutral: number;
}

interface IncidentNode extends BaseNode {
  type: "incident";
  count: number;
  mid: string;
  countsBy?: CountsBy;
  sample?: {
    agree?: string[];
    repeal?: string[];
    neutral?: string[];
  };
}

type LinkDatum = LinkObject & {
  source: string | BaseNode;
  target: string | BaseNode;
  weight: number;
};

export interface NetworkGraphProps {
  data: any;
  startDate?: string;
  endDate?: string;
  period?: PeriodKey;
  maxArticles?: number;
}

function slugify(s: string) {
  return String(s)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/** 그래프 구조 생성 */
function buildGraph(
  raw: any,
  _opts: { startDate?: string; endDate?: string; period?: PeriodKey; maxArticles: number }
) {
  if (raw?.nodes && Array.isArray(raw.nodes)) {
    const nodes: (LegalNode | IncidentNode)[] = [];
    const links: LinkDatum[] = [];

    for (const category of raw.nodes) {
      const label = category.label ?? String(category.id ?? "");
      const id: string =
        category.id ?? `${slugify(label)}-${Math.random().toString(36).slice(2, 8)}`;

      const items: any[] = Array.isArray(category.incidents) ? category.incidents : [];

      const normalized = items
        .map((it, idx) => {
          if (!it) return null;
          const name = it?.name ?? `incident-${idx}`;
          const agreeCnt = it?.["개정강화"]?.count ?? 0;
          const repealCnt = it?.["폐지완화"]?.count ?? it?.["폐지약화"]?.count ?? 0;
          const neutralCnt = it?.["현상유지"]?.count ?? 0;
          const total = agreeCnt + repealCnt + neutralCnt;

          return {
            id: `${id}::${slugify(name)}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
            label: name,
            weight: Math.max(1, total),
            count: Math.max(1, total),
            countsBy: { agree: agreeCnt, repeal: repealCnt, neutral: neutralCnt } as CountsBy,
            sample: {
              agree: Array.isArray(it?.["개정강화"]?.opinions) ? it["개정강화"].opinions : [],
              repeal:
                Array.isArray(it?.["폐지완화"]?.opinions)
                  ? it["폐지완화"].opinions
                  : (Array.isArray(it?.["폐지약화"]?.opinions) ? it["폐지약화"].opinions : []),
              neutral: Array.isArray(it?.["현상유지"]?.opinions) ? it["현상유지"].opinions : [],
            },
          };
        })
        .filter(Boolean) as any[];

      nodes.push({
        id,
        type: "legal",
        label,
        totalCount: normalized.length,
        description: category.description ?? "",
      });

      normalized.forEach((inc) => {
        nodes.push({
          id: inc.id,
          type: "incident",
          label: inc.label,
          count: inc.count,
          mid: id,
          countsBy: inc.countsBy,
          sample: inc.sample,
        });
        links.push({
          source: id,
          target: inc.id,
          weight: inc.weight,
        });
      });
    }

    return { nodes, links };
  }
  return { nodes: [], links: [] };
}

/** 사건 노드가 법조항 주변 반경 내로 못 들어오게 보정 */
function repelFromLegal(alpha: number, nodes: BaseNode[]) {
  const legals = nodes.filter((n): n is BaseNode => !!n && n.type === "legal");
  const incidents = nodes.filter((n): n is BaseNode => !!n && n.type === "incident");

  incidents.forEach((inc) => {
    if (inc.x == null || inc.y == null) return;

    legals.forEach((legal) => {
      if (legal.x == null || legal.y == null) return;

      const dx = inc.x - legal.x;
      const dy = inc.y - legal.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = 120;
      if (dist < minDist && dist > 0.0001) {
        const push = (minDist - dist) * alpha * 0.8;
        inc.x += (dx / dist) * push;
        inc.y += (dy / dist) * push;
      }
    });
  });
}

function makeSqrtSizeScale(counts: number[], outMin = 8, outMax = 36) {
  const min = counts.length ? Math.min(...counts) : 1;
  const max = counts.length ? Math.max(...counts) : 50;
  const a = Math.sqrt(min);
  const b = Math.sqrt(max);
  const span = b - a || 1;
  return (v: number) => {
    const t = (Math.sqrt(v) - a) / span;
    return outMin + t * (outMax - outMin);
  };
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

/** 메인 컴포넌트 */
export default function NetworkGraph({
  data,
  startDate,
  endDate,
  period = "daily_timeline",
  maxArticles = 5,
}: NetworkGraphProps) {
  const fgRef = useRef<ForceGraphMethods>();
  const [selected, setSelected] = useState<LegalNode | IncidentNode | null>(null);
  const [activeTab, setActiveTab] = useState<"agree" | "repeal" | "disagree">("agree");

  const graph = useMemo(
    () => buildGraph(data, { startDate, endDate, period, maxArticles }),
    [data, startDate, endDate, period, maxArticles]
  );

  // Force 설정
  useEffect(() => {
    if (!fgRef.current) return;
    const fg = fgRef.current;

    fg.d3Force("link")?.distance((link: any) => 100 + Math.sqrt(link.weight ?? 1) * 2);
    fg.d3Force("link")?.strength(0.4);
    fg.d3Force("charge")?.strength(-300);

    fg.d3Force(
      "collide",
      d3
        .forceCollide()
        .radius((node: any) => (node.type === "legal" ? 75 : 35))
        .strength(1.0)
    );

    fg.d3ReheatSimulation();
  }, [graph]);

  const sizeScale = useMemo(() => {
    const counts = graph.nodes.filter((n: any) => n.type === "incident").map((n: any) => n.count as number);
    return makeSqrtSizeScale(counts);
  }, [graph.nodes]);

  const width = 920;
  const height = 290;

  const tabMeta = useMemo(() => ({
    agree: {
      label: "개정강화",
      getCount: (n?: IncidentNode) => n?.countsBy?.agree ?? 0,
      getList: (n?: IncidentNode) => n?.sample?.agree ?? [],
    },
    repeal: {
      label: "폐지완화",
      getCount: (n?: IncidentNode) => n?.countsBy?.repeal ?? 0,
      getList: (n?: IncidentNode) => n?.sample?.repeal ?? [],
    },
    disagree: {
      label: "현상유지",
      getCount: (n?: IncidentNode) => n?.countsBy?.neutral ?? 0,
      getList: (n?: IncidentNode) => n?.sample?.neutral ?? [],
    },
  }), []);

  const selIncident =
    selected && selected.type === "incident"
      ? (selected as IncidentNode)
      : undefined;

  // ✅ 그래프가 렌더링된 뒤 자동으로 중앙 정렬 & 줌 맞추기
  useEffect(() => {
    if (!fgRef.current || !graph.nodes.length) return;
    const fg = fgRef.current;
    // 0.5초 뒤 자동으로 전체 보기 맞추기 (시뮬레이션 안정화 시간)
    const timer = setTimeout(() => {
      fg.zoomToFit(800, 80); // 800ms 애니메이션, 80px padding
    }, 500);
    return () => clearTimeout(timer);
  }, [graph]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full h-[400px]">
      {/* LEFT: Graph */}
      <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-white/70 p-4 relative">
        {/* 전체 보기 버튼 */}
        <button
          onClick={() => {
            fgRef.current?.zoomToFit(800, 80);
          }}
          className="absolute top-2 right-2 bg-white/90 hover:bg-neutral-100 text-xs px-2 py-1 rounded-lg border border-neutral-200 shadow-sm transition"
        >
          전체 보기
        </button>

        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <span className="inline-block w-3 h-3 rounded-full bg-[#e6f0ff] border border-[#7aa1ff]" /> Incident
          <span className="inline-block w-4 h-3 rounded bg-[#fff7ed] border border-[#f59e0b]" /> Legal
        </div>

        <div className="mt-4 rounded-xl overflow-hidden" style={{ width: "100%", height }}>
          <ForceGraph2D
            key={graph.nodes.map((n) => n.id).join(",")}
            nodeId="id"
            ref={fgRef as any}
            width={width}
            height={height}
            graphData={{ nodes: graph.nodes, links: graph.links }}
            nodeRelSize={4}
            enableNodeDrag
            cooldownTicks={35}
            linkWidth={(l: any) => Math.max(1, Math.min(4, Math.sqrt(l.weight || 0) / 3))}
            linkColor={() => "#9aa4b288"}
            linkOpacity={0.6}
            onNodeClick={(n) => setSelected(n as any)}
            onEngineTick={() => {
              if (!graph?.nodes?.length) return;
              repelFromLegal(0.3, graph.nodes as BaseNode[]);
            }}
            // nodeCanvasObject={(node, ctx) => {
            //   const n = node as LegalNode | IncidentNode;

            //   if (!isFinite(n.x!) || !isFinite(n.y!)) return;
            //   const label = n.label ?? "";

            //   ctx.textAlign = "center";
            //   ctx.textBaseline = "middle";
            //   ctx.font = `${n.type === "legal" ? 12 : 11}px Inter`;

            //   if (n.type === "incident") {
            //     const r = sizeScale((n as IncidentNode).count);
            //     if (!isFinite(n.x!) || !isFinite(n.y!) || !isFinite(r)) return;

            //     const grad = ctx.createRadialGradient(n.x!, n.y!, 0, n.x!, n.y!, r);
            //     grad.addColorStop(0, "rgba(122,161,255,0.9)");
            //     grad.addColorStop(0.4, "rgba(122,161,255,0.4)");
            //     grad.addColorStop(1, "rgba(122,161,255,0)");

            //     ctx.fillStyle = grad;
            //     ctx.beginPath();
            //     ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
            //     ctx.fill();

            //     ctx.strokeStyle = "rgba(122,161,255,0.6)";
            //     ctx.lineWidth = 0.2;
            //     ctx.stroke();
            //   } else {
            //     const w = 140, h = 44, x = n.x! - w / 2, y = n.y! - h / 2;
            //     if (!isFinite(x) || !isFinite(y)) return;

            //     const grad = ctx.createLinearGradient(x, y, x, y + h);
            //     grad.addColorStop(0, "rgba(255,220,180,0.9)");
            //     grad.addColorStop(1, "rgba(255,245,225,0.7)");

            //     ctx.fillStyle = grad;
            //     roundRectPath(ctx, x, y, w, h, 10);
            //     ctx.fill();
            //     ctx.strokeStyle = "#f59e0b";
            //     ctx.lineWidth = 0.2;
            //     ctx.stroke();
            //   }

            //   ctx.fillStyle = "#1f2937";
            //   ctx.fillText(label, n.x!, n.y!);
            // }}
          nodeCanvasObject={(node, ctx) => {
  const n = node as LegalNode | IncidentNode;
  if (!isFinite(n.x!) || !isFinite(n.y!)) return;

  const label = n.label ?? "";
  const isLegal = n.type === "legal";

  // 🔹 색상 지정 (단일톤 + 살짝 채도 낮은 파스텔 계열)
  const color = isLegal ? "#2eb4a770" : "#2eb4a770"; 

  // 🔹 크기
  const r = isLegal ? 22 : Math.max(10, sizeScale((n as IncidentNode).count));

  // 🔹 미세한 그림자 (살짝 띄운 느낌만)
  ctx.shadowColor = "rgba(0,0,0,0.08)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // 🔹 원형 그리기 (단색)
  ctx.beginPath();
  ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  // 🔹 그림자 해제 (텍스트엔 적용 안 되게)
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // 🔹 라벨 (흰색, 중앙 정렬)
  ctx.fillStyle = "#1d1c1cff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${isLegal ? 13 : 12}px Inter, sans-serif`;
  ctx.fillText(label, n.x!, n.y!);
}}


            nodePointerAreaPaint={(node, color, ctx) => {
              const n = node as LegalNode | IncidentNode;
              ctx.fillStyle = color;
              if (n.type === "incident") {
                const r = sizeScale((n as IncidentNode).count);
                ctx.beginPath();
                ctx.arc(n.x!, n.y!, r + 3, 0, 2 * Math.PI);
                ctx.fill();
              } else {
                const w = 160;
                const h = 46;
                const x = n.x! - w / 2;
                const y = n.y! - h / 2;
                roundRectPath(ctx, x, y, w, h, 10);
                ctx.fill();
              }
            }}
            minZoom={0}
            maxZoom={1.5}
          />
        </div>
      </div>

      {/* RIGHT: Info */}
      <aside className="lg:col-span-1">
        <div className="h-full flex flex-col bg-white rounded-2xl  shadow-xl p-4 space-y-2">
          {!selected ? (
            <div className="text-sm text-neutral-500 flex-1 flex items-center justify-center text-center">
              항목을 선택하면<br />상세 정보가 표시됩니다.
            </div>
          ) : selected.type === "legal" ? (
            <div className="space-y-4 text-sm text-neutral-800">
              <div>
                <div className="text-xs text-neutral-500 mb-1">법조항</div>
                <div className="text-base font-semibold text-[#2D2928]">
                  {(selected as LegalNode).label}
                </div>
                {selected.description && (
                  <p className="text-[13px] text-neutral-600 leading-relaxed bg-neutral-50 border border-neutral-200 rounded-md p-2 mt-2">
                    {selected.description}
                  </p>
                )}
              </div>

              <div className="text-xs text-neutral-500 border-t border-gray-300 pt-2">
                총 사건 수:{" "}
                <b className="text-neutral-700">
                  {(selected as LegalNode).totalCount}
                </b>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-sm text-neutral-800 flex-1 flex flex-col">
              <div>
                <div className="text-xs text-neutral-500 mb-1">사건</div>
                <div className="text-base font-semibold text-[#2D2928]">
                  {selIncident?.label}
                </div>
              </div>

              <SemiDonutChart
                data={{
                  agree: selIncident?.countsBy?.agree ?? 0,
                  repeal: selIncident?.countsBy?.repeal ?? 0,
                  neutral: selIncident?.countsBy?.neutral ?? 0,
                }}
                active={activeTab}
                onChange={(key) => setActiveTab(key)}
              />

              {/* 의견 리스트 */}
              <div className="flex-1 flex flex-col pr-1">
                <div className="text-xs text-neutral-500 mb-1">
                  {tabMeta[activeTab].label} 의견
                </div>
                <div className="overflow-y-auto max-h-[100px] pr-1">
                  <ul className="space-y-2">
                    {(tabMeta[activeTab].getList(selIncident) || []).slice(0, 6).map((text, i) => (
                      <li
                        key={i}
                        className="text-[13px] leading-snug bg-white border border-neutral-200 rounded-md px-3 py-2 shadow-sm"
                      >
                        • {text}
                      </li>
                    ))}
                    {tabMeta[activeTab].getList(selIncident)?.length === 0 && (
                      <li className="text-[13px] text-neutral-400">표시할 의견이 없습니다.</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="pt-2 text-xs text-neutral-500 border-t border-gray-300">
                총 의견 수:{" "}
                <b className="text-neutral-700">{selIncident?.count.toLocaleString()}</b>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
