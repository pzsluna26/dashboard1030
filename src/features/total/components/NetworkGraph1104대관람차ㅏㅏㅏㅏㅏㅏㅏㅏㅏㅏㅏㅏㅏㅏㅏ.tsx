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
  const nodes: (LegalNode | IncidentNode)[] = [];
  const links: LinkDatum[] = [];

  console.log("🔍 Raw data:", raw);
  

  // raw.nodes가 배열인지 확인
  if (!raw?.nodes || !Array.isArray(raw.nodes)) {
    console.warn("⚠️ No nodes array found in data");
    return { nodes, links };
  }

  console.log("📦 Processing", raw.nodes.length, "nodes");
  

  // 첫 번째 노드를 확인해서 구조 판단
  const nodeArray = Array.isArray(raw) ? raw : raw?.nodes ?? [];
  const firstNode = nodeArray[0];
  const isNestedStructure = firstNode && Array.isArray(firstNode.incidents);
  if (isNestedStructure) {
    // 문서 2번 구조: nodes 안에 incidents 배열이 있는 경우
    console.log("📋 Using nested structure (incidents array)");
    console.log("📋 Using flat structure (type-based)");
    for (const category of nodeArray) {
      const label = category.label ?? String(category.id ?? "");
      const legalId = `legal-${slugify(label)}-${Math.random().toString(36).slice(2, 8)}`;

      console.log("➕ Adding Legal node:", label);

      // Legal 노드 추가
      nodes.push({
        id: legalId,
        type: "legal",
        label,
        totalCount: Array.isArray(category.incidents) ? category.incidents.length : 0,
        description: category.description ?? "",
      });

      // incidents 처리
      if (Array.isArray(category.incidents)) {
        console.log("  📝", category.incidents.length, "incidents found");

        category.incidents.forEach((incident: any, idx: number) => {
          console.log("📥 Incident raw input:", incident.name, {
  개정강화: incident["개정강화"],
  폐지완화: incident["폐지완화"],
  폐지약화: incident["폐지약화"],
  현상유지: incident["현상유지"],
});

          if (!incident) return;

          const incidentName = incident.name ?? `incident-${idx}`;
          const agreeData = incident["개정강화"] ?? {};
          const repealData = incident["폐지완화"] ?? incident["폐지약화"] ?? {};
          const neutralData = incident["현상유지"] ?? {};

          const agreeCnt = agreeData.count ?? 0;
          const repealCnt = repealData.count ?? 0;
          const neutralCnt = neutralData.count ?? 0;
          const total = Math.max(1, agreeCnt + repealCnt + neutralCnt);

          const incidentId = `incident-${slugify(incidentName)}-${idx}-${Math.random().toString(36).slice(2, 8)}`;

          console.log("    ➕ Adding Incident:", incidentName, { agree: agreeCnt, repeal: repealCnt, neutral: neutralCnt });

          // Incident 노드 추가
          nodes.push({
            id: incidentId,
            type: "incident",
            label: incidentName,
            count: total,
            mid: legalId,
            countsBy: {
              agree: agreeCnt,
              repeal: repealCnt,
              neutral: neutralCnt,
            },
            sample: {
              agree: Array.isArray(agreeData.opinions) ? agreeData.opinions : [],
              repeal: Array.isArray(repealData.opinions) ? repealData.opinions : [],
              neutral: Array.isArray(neutralData.opinions) ? neutralData.opinions : [],
            },
          });

          // Legal과 Incident 연결
          links.push({
            source: legalId,
            target: incidentId,
            weight: total,
          });
        });
      }
    }
  } else {
    // 평탄화된 구조: nodes 배열에 type으로 구분
    console.log("📋 Using flat structure (type-based)");
    console.log("🔍 Sample incident node:", raw.nodes.find((n: any) => n.type === "incident"));

    for (const node of raw.nodes) {
      const label = node.label ?? String(node.id ?? "");

      if (node.type === "category") {
        console.log("➕ Adding Legal node:", label);

        const incidentCount = raw.nodes.filter((n: any) =>
          n.type === "incident" &&
          raw.links?.some((l: any) => l.source === node.id && l.target === n.id)
        ).length;

        nodes.push({
          id: node.id,
          type: "legal",
          label,
          totalCount: incidentCount,
          description: node.description ?? "",
        });
      } else if (node.type === "incident") {
        console.log("  ➕ Adding Incident:", label, node);

        // 원본 nodes 데이터에서 incidents 배열을 찾아서 매칭
        let agreeData = {};
        let repealData = {};
        let neutralData = {};

        // 먼저 노드 자체에서 찾기
       if (node["개정강화"] || node["폐지완화"] || node["현상유지"]) {
  agreeData = node["개정강화"] ?? {};
  repealData = node["폐지완화"] ?? node["폐지약화"] ?? {};
  neutralData = node["현상유지"] ?? {};
} else {
  // 👇 incidents 배열에서 매칭되는 실제 의견 데이터 찾아오기
  for (const category of raw.nodes) {
    if (Array.isArray(category.incidents)) {
      const matchedIncident = category.incidents.find((inc: any) =>
        inc.name === node.label || inc.name === node.id
      );
      if (matchedIncident) {
        agreeData = matchedIncident["개정강화"] ?? {};
        repealData = matchedIncident["폐지완화"] ?? matchedIncident["폐지약화"] ?? {};
        neutralData = matchedIncident["현상유지"] ?? {};
        break;
      }
    }
  }
}


        const agreeCnt = agreeData.count ?? 0;
        const repealCnt = repealData.count ?? 0;
        const neutralCnt = neutralData.count ?? 0;
        const total = Math.max(1, agreeCnt + repealCnt + neutralCnt);

        console.log("    📊 Counts:", { agree: agreeCnt, repeal: repealCnt, neutral: neutralCnt });

        const parentLink = raw.links?.find((l: any) => l.target === node.id);
        const parentId = parentLink?.source ?? "";

        nodes.push({
          id: node.id,
          type: "incident",
          label,
          count: total,
          mid: parentId,
          countsBy: {
            agree: agreeCnt,
            repeal: repealCnt,
            neutral: neutralCnt,
          },
          sample: {
            agree: Array.isArray(agreeData.opinions) ? agreeData.opinions : [],
            repeal: Array.isArray(repealData.opinions) ? repealData.opinions : [],
            neutral: Array.isArray(neutralData.opinions) ? neutralData.opinions : [],
          },
        });
      }
    }

    // 링크 복사
    if (Array.isArray(raw.links)) {
      raw.links.forEach((link: any) => {
        links.push({
          source: link.source,
          target: link.target,
          weight: link.value ?? 1,
        });
      });
    }
  }

  console.log("✅ Graph built:", {
    totalNodes: nodes.length,
    legalNodes: nodes.filter(n => n.type === "legal").length,
    incidentNodes: nodes.filter(n => n.type === "incident").length,
    links: links.length,
  });

  return { nodes, links };
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

  const graph = useMemo(() => {
    const result = buildGraph(data, { startDate, endDate, period, maxArticles });
    return result;
  }, [data, startDate, endDate, period, maxArticles]);

  useEffect(() => {
    if (!fgRef.current || !graph.nodes.length) return;
    const fg = fgRef.current;
    const timer = setTimeout(() => {
      fg.zoomToFit(800, 80);
    }, 500);
    return () => clearTimeout(timer);
  }, [graph]);

  useEffect(() => {
    if (!graph.nodes.length) return;
    const incidents = graph.nodes.filter((n: any) => n.type === "incident");
    if (incidents.length > 0) {
      const randomIncident = incidents[Math.floor(Math.random() * incidents.length)];
      setSelected(randomIncident as any);
    }
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full h-[400px]">
      {/* LEFT: Graph */}
      <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-white/70 p-4 relative">
        <button
          onClick={() => {
            fgRef.current?.zoomToFit(800, 80);
          }}
          className="absolute top-2 right-2 bg-white/90 hover:bg-neutral-100 text-xs px-2 py-1 rounded-lg border border-neutral-200 shadow-sm transition"
        >
          전체 보기
        </button>

        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-600/80 border border-purple-600" /> Incident
          <span className="inline-block w-4 h-3 rounded bg-green-500/80 border border-green-500" /> Legal
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
            onNodeClick={(n) => {
              console.log("🖱️ Clicked node:", n);
              console.log("📊 Node data:", {
                type: (n as any).type,
                countsBy: (n as any).countsBy,
                sample: (n as any).sample,
              });
              setSelected(n as any);
            }}
            onEngineTick={() => {
              if (!graph?.nodes?.length) return;
              repelFromLegal(0.3, graph.nodes as BaseNode[]);
            }}
            nodeCanvasObject={(node, ctx) => {
              const n = node as LegalNode | IncidentNode;
              if (!isFinite(n.x!) || !isFinite(n.y!)) return;

              const label = n.label ?? "";
              const isLegal = n.type === "legal";

              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              if (isLegal) {
                // Legal 노드: 둥근 사각형
                const w = 140, h = 44;
                const x = n.x! - w / 2;
                const y = n.y! - h / 2;

                // 그라데이션 배경
                const grad = ctx.createLinearGradient(x, y, x, y + h);
                grad.addColorStop(0, "rgba(34, 197, 94, 0.9)");
                grad.addColorStop(1, "rgba(34, 197, 94, 0.7)");

                ctx.fillStyle = grad;
                roundRectPath(ctx, x, y, w, h, 10);
                ctx.fill();

                // 테두리
                ctx.strokeStyle = "rgba(34, 197, 94, 1)";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // 텍스트
                ctx.fillStyle = "#ffffff";
                ctx.font = "600 13px Inter, sans-serif";
                ctx.fillText(label, n.x!, n.y!);
              } else {
                // Incident 노드: 원형
                const r = Math.max(12, sizeScale((n as IncidentNode).count));

                // 그라데이션 배경
                const grad = ctx.createRadialGradient(n.x!, n.y!, 0, n.x!, n.y!, r);
                grad.addColorStop(0, "rgba(147, 51, 234, 0.95)");
                grad.addColorStop(0.7, "rgba(147, 51, 234, 0.75)");
                grad.addColorStop(1, "rgba(147, 51, 234, 0.4)");

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
                ctx.fill();

                // 테두리
                ctx.strokeStyle = "rgba(147, 51, 234, 0.8)";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // 텍스트
                ctx.fillStyle = "#ffffff";
                ctx.font = "500 11px Inter, sans-serif";
                ctx.fillText(label, n.x!, n.y!);
              }
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
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-xl p-4 space-y-2">
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

              {/* SemiDonutChart 삽입 */}
              {selIncident && selIncident.countsBy && (
                <div>
                  <div className="text-xs text-neutral-500">의견 분포</div>
                  <div className="w-[140px] mx-auto my-2">
                    <SemiDonutChart
                      counts={{
                        agree: selIncident.countsBy.agree,
                        repeal: selIncident.countsBy.repeal,
                        neutral: selIncident.countsBy.neutral,
                      }}
                      onSelect={(key) => setActiveTab(key)}
                      selected={activeTab}
                    />
                  </div>
                </div>
              )}


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