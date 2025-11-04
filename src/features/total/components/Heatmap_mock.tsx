"use client";

import React, { useEffect, useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

/* =========================
   타입 정의
========================= */
type LawDatum = {
  name: string;
  개정강화: number;
  폐지완화: number;
  현상유지: number;
};
type ApiResp = { laws: LawDatum[] };

const COLS = ["개정강화", "폐지완화", "현상유지"] as const;
type BucketKey = (typeof COLS)[number];

/* =========================
   MOCK DATA
========================= */
const mockLaws: LawDatum[] = [
  {
    name: "개인정보보호법,정보통신망법",
    개정강화: 45,
    폐지완화: 25,
    현상유지: 30,
  },
  {
    name: "자본시장법,특정금융정보법,전자금융거래법,전자증권법,금융소비자보호법",
    개정강화: 60,
    폐지완화: 20,
    현상유지: 20,
  },
  {
    name: "중대재해처벌법",
    개정강화: 15,
    폐지완화: 70,
    현상유지: 15,
  },
  {
    name: "아동복지법",
    개정강화: 30,
    폐지완화: 10,
    현상유지: 60,
  },
];

/* =========================
   날짜 계산 유틸
========================= */
const fmtKstDate = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);

const getDefaultRange = () => {
  const end = new Date("2025-08-13T23:59:59+09:00");
  const start = new Date(end.getTime() - 13 * 24 * 60 * 60 * 1000); // 14일 포함
  return { start: fmtKstDate(start), end: fmtKstDate(end) };
};

const Y_AXIS_LABEL_MAP: Record<string, string> = {
  "자본시장법,특정금융정보법,전자금융거래법,전자증권법,금융소비자보호법": "금융관련법",
  "개인정보보호법,정보통신망법": "개인정보관련법",
  "중대재해처벌법": "중대재해처벌법",
  "아동복지법": "아동복지법",
};

/* =========================
   메인 컴포넌트
========================= */
export default function Heatmap({
  startDate,
  endDate,
}: {
  startDate?: string;
  endDate?: string;
}) {
  const [hcReady, setHcReady] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [laws, setLaws] = useState<LawDatum[]>([]);
  const [loading, setLoading] = useState(true);

  const { start, end } = useMemo(() => {
    if (startDate && endDate) return { start: startDate, end: endDate };
    return getDefaultRange();
  }, [startDate, endDate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      try {
        (window as any).Highcharts = Highcharts;
        await import("highcharts/modules/heatmap.js");
        if (!cancelled) setHcReady(true);
      } catch (e) {
        console.error("Highcharts heatmap init failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setFetchErr(null);

        const res = await fetch(
          `http://10.125.121.213:8080/api/dashboard/heatmap?start=${start}&end=${end}`,
          { method: "GET", cache: "no-store" }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

        const data: ApiResp = await res.json();
        if (!data || !Array.isArray(data.laws)) throw new Error("Unexpected API shape");

        if (!cancelled) setLaws(data.laws);
      } catch (err: any) {
        if (!cancelled) {
          console.warn("❌ Heatmap fetch 실패, mock 데이터로 대체:", err);
          setLaws(mockLaws); // ✅ fallback to mock data
          // setFetchErr("서버에서 데이터를 가져올 수 없어 mock 데이터를 사용합니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [start, end]);

  const { rows, points, insightText } = useMemo(() => {
    if (!laws.length) return { rows: [], points: [], insightText: "데이터가 없습니다." };

    const rows = laws.map((d) => Y_AXIS_LABEL_MAP[d.name] || d.name);
    const points = laws.flatMap((row, y) => {
      const total = COLS.reduce((acc, key) => acc + (row[key] ?? 0), 0);
      return COLS.map((key, x) => {
        const val = row[key] ?? 0;
        const pct = total > 0 ? (val / total) * 100 : 0;
        return { x, y, value: pct / 100, pct };
      });
    });

    const cells = points.map((p) => ({
      rowKey: rows[p.y],
      colKey: COLS[p.x],
      ratio: p.value,
      pct: p.pct,
    }));

    const byRatioDesc = [...cells].sort((a, b) => b.ratio - a.ratio);
    const byRatioAsc = [...cells].sort((a, b) => a.ratio - b.ratio);
    const byPctDesc = [...cells].sort((a, b) => b.pct - a.pct);
    const pctFmt = (x: number) => `${x.toFixed(1)}%`;

    const parts: string[] = [];
    if (byRatioDesc[0])
      parts.push(`최고 비율: ${byRatioDesc[0].rowKey}·${byRatioDesc[0].colKey} ${pctFmt(byRatioDesc[0].pct)}`);
    if (byRatioAsc[0])
      parts.push(`최저 비율: ${byRatioAsc[0].rowKey}·${byRatioAsc[0].colKey} ${pctFmt(byRatioAsc[0].pct)}`);
    if (byPctDesc[0])
      parts.push(`절대값 최다: ${byPctDesc[0].rowKey}·${byPctDesc[0].colKey} ${pctFmt(byPctDesc[0].pct)}`);

    return { rows, points, insightText: parts.join("  •  ") };
  }, [laws]);

  const options: Highcharts.Options = useMemo(
    () => ({
      chart: {
        type: "heatmap",
        height: 220,
        backgroundColor: "transparent",
        spacing: [10, 10, 10, 10],
        style: { fontFamily: "ui-sans-serif, system-ui, -apple-system" },
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: {
        enabled: true,
        align: "right",
        verticalAlign: "top",
        layout: "vertical",
        symbolHeight: 120,
        margin: 16,
      },
      xAxis: {
        categories: COLS as any,
        title: { text: "의견 유형" },
        labels: { style: { color: "#525252" } },
      },
      yAxis: {
        categories: rows as any,
        title: { text: "법령(분야)" },
        reversed: true,
        labels: { style: { color: "#525252" } },
      },
      colorAxis: {
        min: 0,
        max: 1,
        stops: [
          [0, "#ffcdb2a6"],
          [1 / 3, "#FFB4A2"],
          [2 / 3, "#e5989bb2"],
          [1, "#b5828caf"],
        ],
      },
      tooltip: {
        useHTML: true,
        formatter: function () {
          const self = this as any;
          const xCat = self.series.xAxis.categories[self.point.x];
          const yCatRaw = self.series.yAxis.categories[self.point.y];
          const yCat = Y_AXIS_LABEL_MAP[yCatRaw] || yCatRaw;
          const pct = self.point.pct as number;
          return `<div style="padding:4px 6px;">
            <div style="font-weight:600;margin-bottom:2px;">${yCat} · ${xCat}</div>
            <div>${pct.toFixed(1)}%</div>
          </div>`;
        },
      },
      series: [
        {
          type: "heatmap",
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            formatter: function () {
              const pct = (this as any).pct as number;
              return `${pct.toFixed(0)}%`;
            },
            style: { color: "#222", textOutline: "none", fontSize: "10px" },
          },
          states: { hover: { enabled: true } },
          data: points as any,
        },
      ],
      responsive: {
        rules: [
          {
            condition: { maxWidth: 800 },
            chartOptions: {
              chart: { height: 280 },
              legend: { enabled: false },
              xAxis: { labels: { style: { fontSize: "10px" } } },
              yAxis: { labels: { style: { fontSize: "10px" } } },
              series: [{ dataLabels: { style: { fontSize: "9px" } } }] as any,
            },
          },
        ],
      },
    }),
    [rows, points]
  );

  if (!hcReady)
    return (
      <div className="w-full h-full grid place-items-center text-neutral-400">
        차트 모듈 로딩 중…
      </div>
    );

  if (loading)
    return (
      <div className="w-full h-full grid place-items-center text-neutral-400">
        데이터 불러오는 중…
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 ">
        <HighchartsReact highcharts={Highcharts} options={options} immutable />
      </div>

      <div className="text-xs mt-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm text-neutral-800">
          {insightText && insightText.length > 0
            ? insightText
            : "표시할 인사이트가 없습니다."}
        </div>
        {fetchErr && (
          <div className="mt-2 text-red-400 text-xs italic">⚠️ {fetchErr}</div>
        )}
      </div>
    </div>
  );
}
