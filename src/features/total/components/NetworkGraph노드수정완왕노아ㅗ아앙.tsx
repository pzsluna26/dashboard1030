"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ForceGraphMethods, LinkObject, NodeObject } from "react-force-graph-2d";

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

function inDateRange(dateStr: string, start?: string, end?: string) {
  if (!start && !end) return true;
  const n = (s?: string) => (s ? new Date(s + "T00:00:00").getTime() : undefined);
  const d = new Date(dateStr + "T00:00:00").getTime();
  const s = n(start);
  const e = n(end);
  if (s !== undefined && d < s) return false;
  if (e !== undefined && d > e) return false;
  return true;
}

function slugify(s: string) {
  return String(s)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/** ✅ 새 JSON 구조와 구 addsocial 구조 모두 지원 */
function buildGraph(
  raw: any,
  opts: { startDate?: string; endDate?: string; period?: PeriodKey; maxArticles: number }
) {
  if (raw?.nodes && Array.isArray(raw.nodes)) {
    const nodes: (LegalNode | IncidentNode)[] = [];
    const links: LinkDatum[] = [];

    for (const category of raw.nodes) {
      const label = category.label ?? String(category.id ?? "");
      const id: string =
        category.id ?? `${slugify(label)}-${Math.random().toString(36).slice(2, 8)}`; // 🔥 고유 ID

      const items: any[] = Array.isArray(category.incidents) ? category.incidents : [];

      const normalized = items
        .map((it, idx) => {
          if (!it) return null;
          if (typeof it === "string") {
            return {
              id: `${id}::incident-${idx}-${Math.random().toString(36).slice(2, 8)}`, // 🔥 고유화
              label: it,
              weight: 1,
              count: 1,
              countsBy: { agree: 0, repeal: 0, neutral: 0 } as CountsBy,
              sample: { agree: [], repeal: [], neutral: [] },
            };
          }

          const name = it?.name ?? `incident-${idx}`;
          const agreeCnt = it?.["개정강화"]?.count ?? 0;
          const repealCnt = it?.["폐지완화"]?.count ?? it?.["폐지약화"]?.count ?? 0;
          const neutralCnt = it?.["현상유지"]?.count ?? 0;
          const total = agreeCnt + repealCnt + neutralCnt;

          const agreeOps: string[] = Array.isArray(it?.["개정강화"]?.opinions) ? it["개정강화"].opinions : [];
          const repealOps: string[] =
            Array.isArray(it?.["폐지완화"]?.opinions)
              ? it["폐지완화"].opinions
              : (Array.isArray(it?.["폐지약화"]?.opinions) ? it["폐지약화"].opinions : []);
          const neutralOps: string[] = Array.isArray(it?.["현상유지"]?.opinions) ? it["현상유지"].opinions : [];

          return {
            id: `${id}::${slugify(name)}-${idx}-${Math.random().toString(36).slice(2, 8)}`, // 🔥 고유 ID 보장
            label: name,
            weight: Math.max(1, total),
            count: Math.max(1, total),
            countsBy: { agree: agreeCnt, repeal: repealCnt, neutral: neutralCnt } as CountsBy,
            sample: { agree: agreeOps, repeal: repealOps, neutral: neutralOps },
          };
        })
        .filter(Boolean);

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

  // ─────────────── addsocial fallback (기존 로직) ───────────────
  const { startDate, endDate, maxArticles } = opts;
  const domains: string[] = Object.keys(raw || {});
  const legalMap: Record<string, { total: number; incidents: Record<string, IncidentNode> }> = {};

  for (const dom of domains) {
    const daily = raw[dom]?.addsocial?.["daily_timeline"] || {};
    for (const dateStr of Object.keys(daily)) {
      if (!inDateRange(dateStr, startDate, endDate)) continue;
      const dayEntry = daily[dateStr];
      const mids = dayEntry?.["중분류목록"] || {};
      for (const mid of Object.keys(mids)) {
        const midObj = mids[mid];
        const subs = midObj?.["소분류목록"] || {};
        for (const subKey of Object.keys(subs)) {
          const s = subs[subKey];
          const agreeList = (s?.["찬성"]?.["개정강화"]?.["소셜목록"] || []) as Array<{ content: string }>;
          const repealList = (s?.["찬성"]?.["폐지약화"]?.["소셜목록"] || []) as Array<{ content: string }>;
          const disagreeList = (s?.["반대"]?.["소셜목록"] || []) as Array<{ content: string }>;
          const count = agreeList.length + repealList.length + disagreeList.length;

          if (!legalMap[mid]) legalMap[mid] = { total: 0, incidents: {} };
          const incId = `${mid}::${subKey}-${Math.random().toString(36).slice(2, 8)}`; // 🔥 고유화
          if (!legalMap[mid].incidents[incId]) {
            legalMap[mid].incidents[incId] = {
              id: incId,
              type: "incident",
              label: subKey.replace(`${mid}_`, ""),
              count: 0,
              mid,
              sample: { agree: [], repeal: [], neutral: [] },
              countsBy: { agree: 0, repeal: 0, neutral: 0 },
            };
          }

          const inc = legalMap[mid].incidents[incId];
          inc.count += count;
          inc.countsBy!.agree += agreeList.length;
          inc.countsBy!.repeal += repealList.length;
          inc.sample!.agree!.push(...agreeList.slice(0, 2).map((x) => x.content));
          inc.sample!.repeal!.push(...repealList.slice(0, 2).map((x) => x.content));
          legalMap[mid].total += count;
        }
      }
    }
  }

  const topLegal = Object.keys(legalMap)
    .map((k) => ({ mid: k, total: legalMap[k].total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, maxArticles)
    .map((x) => x.mid);

  const nodes: (LegalNode | IncidentNode)[] = [];
  const links: LinkDatum[] = [];

  for (const mid of topLegal) {
    nodes.push({
      id: `${mid}-${Math.random().toString(36).slice(2, 8)}`, // 🔥 고유화
      type: "legal",
      label: mid,
      totalCount: legalMap[mid].total,
    });

    const incs = Object.values(legalMap[mid].incidents).filter((i) => i.count > 0);
    incs
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((inc) => {
        nodes.push(inc);
        links.push({
          source: mid,
          target: inc.id,
          weight: inc.count,
        });
      });
  }

  return { nodes, links };
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

/** ✅ 메인 컴포넌트 */
export default function NetworkGraph({
  data,
  startDate,
  endDate,
  period = "daily_timeline",
  maxArticles = 5,
}: NetworkGraphProps) {
  const fgRef = useRef<ForceGraphMethods>();
  const [selected, setSelected] = useState<LegalNode | IncidentNode | null>(null);
  const graph = useMemo(
    () => buildGraph(data, { startDate, endDate, period, maxArticles }),
    [data, startDate, endDate, period, maxArticles]
  );

  const sortedIncidents = useMemo(() => {
    return (graph.nodes as IncidentNode[])
      .filter((n) => n.type === "incident")
      .sort((a, b) => b.count - a.count);
  }, [graph.nodes]);

  const [incidentIndex, setIncidentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"agree" | "repeal" | "disagree">("agree");

  useEffect(() => {
    if (!sortedIncidents.length) return;
    const idx =
      selected?.type === "incident"
        ? sortedIncidents.findIndex((x) => x.id === selected.id)
        : 0;
    setIncidentIndex(Math.max(0, idx));
    if (!selected) setSelected(sortedIncidents[0]);
  }, [sortedIncidents]);

  const sizeScale = useMemo(() => {
    const counts = graph.nodes
      .filter((n: any) => n.type === "incident")
      .map((n: any) => n.count as number);
    return makeSqrtSizeScale(counts);
  }, [graph.nodes]);

  const width = 920;
  const height = 290;

  const tabMeta = useMemo(() => {
    return {
      agree: { label: "개정강화", getCount: (n?: IncidentNode) => n?.countsBy?.agree ?? 0, getList: (n?: IncidentNode) => n?.sample?.agree ?? [] },
      repeal: { label: "폐지완화", getCount: (n?: IncidentNode) => n?.countsBy?.repeal ?? 0, getList: (n?: IncidentNode) => n?.sample?.repeal ?? [] },
      disagree: { label: "현상유지", getCount: (n?: IncidentNode) => n?.countsBy?.neutral ?? 0, getList: (n?: IncidentNode) => n?.sample?.neutral ?? [] },
    } as const;
  }, []);

  const selIncident = selected && selected.type === "incident" ? (selected as IncidentNode) : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full h-[400px]">
      {/* LEFT: Graph */}
      <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-white/70 p-4">
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <span className="inline-block w-3 h-3 rounded-full bg-[#e6f0ff] border border-[#7aa1ff]" /> Incident
          <span className="inline-block w-4 h-3 rounded bg-[#fff7ed] border border-[#f59e0b]" /> Legal
        </div>
        <div className="mt-4 rounded-xl overflow-hidden" style={{ width: "100%", height }}>
          <ForceGraph2D
            key={graph.nodes.map((n) => n.id).join(",")} // 🔥 그래프 리렌더 강제
            nodeId="id"
            ref={fgRef as any}
            width={width}
            height={height}
            graphData={{ nodes: graph.nodes, links: graph.links }}
            nodeRelSize={4}
            enableNodeDrag
            cooldownTicks={60}
            linkWidth={(l: any) => Math.max(1, Math.min(4, Math.sqrt(l.weight || 0) / 3))}
            linkColor={() => "#9aa4b2"}
            linkOpacity={0.6}
            onNodeClick={(n) => setSelected(n as any)}
            nodeCanvasObject={(node, ctx) => {
              const n = node as LegalNode | IncidentNode;
              const label = n.label ?? "";
              ctx.font = `${n.type === "legal" ? 12 : 11}px Inter`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              if (n.type === "incident") {
                const r = sizeScale((n as IncidentNode).count);
                ctx.fillStyle = "#e6f0ff";
                ctx.beginPath();
                ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = "#7aa1ff";
                ctx.lineWidth = 1.5;
                ctx.stroke();
              } else {
                const w = 140,
                  h = 44,
                  x = n.x! - w / 2,
                  y = n.y! - h / 2;
                ctx.fillStyle = "#fff7ed";
                roundRectPath(ctx, x, y, w, h, 10);
                ctx.fill();
                ctx.strokeStyle = "#f59e0b";
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
              ctx.fillStyle = "#213547";
              ctx.fillText(label, n.x!, n.y!);
            }}
            nodePointerAreaPaint={(node, color, ctx) => {
              const n = node as LegalNode | IncidentNode;
              ctx.fillStyle = color;
              if (n.type === "incident") {
                const r = sizeScale((n as IncidentNode).count);
                ctx.beginPath();
                ctx.arc(n.x!, n.y!, r + 2, 0, 2 * Math.PI);
                ctx.fill();
              } else {
                const w = 140,
                  h = 44,
                  x = n.x! - w / 2,
                  y = n.y! - h / 2;
                roundRectPath(ctx, x, y, w, h, 10);
                ctx.fill();
              }
            }}
            minZoom={0.3}
            maxZoom={2}
          />
        </div>
      </div>

      {/* RIGHT: Info */}
      <aside className="lg:col-span-1 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-white/70 p-4 flex flex-col">
        {!selected ? (
          <div className="mt-4 text-sm text-neutral-500">항목을 선택하면 상세가 표시됩니다.</div>
        ) : selected.type === "legal" ? (
          <div className="mt-4 text-sm text-neutral-700 space-y-3">
            <div>
              <div className="text-neutral-500 text-xs mb-1">법조항</div>
              <div className="text-base font-semibold mb-1">{(selected as LegalNode).label}</div>
              {(selected as LegalNode).description && (
                <p className="text-[13px] leading-relaxed text-neutral-600 bg-white/60 border border-neutral-200 rounded-md px-2 py-2">
                  {(selected as LegalNode).description}
                </p>
              )}
            </div>

            <div className="text-xs text-neutral-500">
              총 사건 수: <b className="text-neutral-700">{(selected as LegalNode).totalCount}</b>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-neutral-700 space-y-3">
            <div className="text-neutral-500 text-xs">Incident</div>
            <div className="text-base font-semibold">{selIncident?.label}</div>

            <div className="grid grid-cols-3 gap-2">
              {(["agree", "repeal", "disagree"] as const).map((k) => (
                <div
                  key={k}
                  className={`rounded-lg border px-2 py-1 text-center cursor-pointer ${
                    activeTab === k ? "bg-emerald-50 border-emerald-200" : "bg-white/70 border-neutral-200"
                  }`}
                  onClick={() => setActiveTab(k)}
                >
                  <div className="text-[11px] text-neutral-500">{tabMeta[k].label}</div>
                  <div className="text-[13px] font-semibold">{tabMeta[k].getCount(selIncident).toLocaleString()}건</div>
                </div>
              ))}
            </div>

            <div className="mt-1">
              <div className="text-xs text-neutral-500 mb-1">{tabMeta[activeTab].label} 의견</div>
              <ul className="space-y-1.5 max-h-28 overflow-auto pr-1">
                {(tabMeta[activeTab].getList(selIncident) || [])
                  .slice(0, 6)
                  .map((t, i) => (
                    <li key={i} className="text-[12px] leading-snug bg-white/60 border border-neutral-200 rounded-md px-2 py-1">
                      • {t}
                    </li>
                  ))}
                {tabMeta[activeTab].getList(selIncident)?.length === 0 && (
                  <li className="text-[12px] text-neutral-400">표시할 의견이 없습니다.</li>
                )}
              </ul>
            </div>

            <div className="pt-1 text-xs text-neutral-500">
              총 코멘트 수: <b className="text-neutral-700">{selIncident?.count.toLocaleString()}</b>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
