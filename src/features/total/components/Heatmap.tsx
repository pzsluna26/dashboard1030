'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useHeatmap } from '../hooks/useHeatmap';

const X_LABELS = ['개정강화', '폐지완화', '현상유지'] as const;
const Y_LABELS_MAP: Record<string, string> = {
  '자본시장법,특정금융정보법,전자금융거래법,전자증권법,금융소비자보호법': '금융관련법',
  '개인정보보호법,정보통신망법': '개인정보관련법',
  '중대재해처벌법': '중대재해처벌법',
  '아동복지법': '아동복지법',
};

export default function Heatmap({ startDate, endDate }: { startDate?: string; endDate?: string; }) {
  const { laws, loading, error } = useHeatmap(startDate, endDate);
  const [hcReady, setHcReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        (window as any).Highcharts = Highcharts;
        await import('highcharts/modules/heatmap.js').catch(async () => { await import('highcharts/modules/heatmap'); });
        if (!cancelled) setHcReady(true);
      } catch {
   
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const { rows, points, insightText } = useMemo(() => {
    if (!laws.length) return { rows: [], points: [], insightText: '데이터가 없습니다.' };
    const rows = laws.map((d) => Y_LABELS_MAP[d.name] || d.name);
    const points = laws.flatMap((row, y) => {
      const r = row['개정강화'] ?? 0;
      const p = row['폐지완화'] ?? 0;
      const o = row['현상유지'] ?? 0;
      const t = r + p + o;
      return X_LABELS.map((key, x) => {
        const c = (row as any)[key] ?? 0;
        const pct = t > 0 ? (c / t) * 100 : 0;
        return { x, y, value: pct / 100, pct };
      });
    });

    
    const byPctDesc = [...points].sort((a,b)=>b.pct-a.pct);
    const best = byPctDesc[0];
    const insightText = best ? `절대값 최다: ${rows[best.y]}·${X_LABELS[best.x]} ${best.pct.toFixed(1)}%` : '표시할 인사이트가 없습니다.';
    return { rows, points, insightText };
  }, [laws]);

  const options: Highcharts.Options = {
    chart: { type: 'heatmap', height: 290, backgroundColor: 'transparent', spacing: [10,10,10,10] },
    title: { text: undefined }, credits: { enabled: false },
    legend: { enabled: true, align: 'right', verticalAlign: 'top', layout: 'vertical', symbolHeight: 120, margin: 16 },
    xAxis: { categories: X_LABELS as any, title: { text: '의견 유형' }, labels: { style: { color: '#525252' } } },
    yAxis: { categories: rows as any, title: { text: '법령(분야)' }, reversed: true, labels: { style: { color: '#525252' } } },
    colorAxis: { min: 0, max: 1, stops: [[0,'#FFCDB2'], [1/3,'#FFB4A2'], [2/3,'#e5989bb2'], [1,'#b5828caf']] },
    tooltip: {
      useHTML: true,
      formatter: function () {
        const self = this as any;
        const xCat = self.series.xAxis.categories[self.point.x];
        const yCatRaw = self.series.yAxis.categories[self.point.y];
        const yCat = Y_LABELS_MAP[yCatRaw] || yCatRaw;
        const pct = self.point.pct as number;
        return `<div style="padding:4px 6px;"><div style="font-weight:600;margin-bottom:2px;">${yCat} · ${xCat}</div><div>${pct.toFixed(1)}%</div></div>`;
      },
    },
    series: [{ type: 'heatmap', borderWidth: 0, dataLabels: { enabled: true, formatter: function(){ const pct = (this as any).point.pct as number; return `${pct.toFixed(0)}%`; }, style:{ color:'#222', textOutline:'none', fontSize:'10px' } }, data: points as any }],
    responsive: { rules: [{ condition: { maxWidth: 800 }, chartOptions: { chart: { height: 280 }, legend: { enabled: false }, xAxis: { labels: { style: { fontSize: '10px' } } }, yAxis: { labels: { style: { fontSize: '10px' } } }, series: [{ dataLabels: { style: { fontSize: '9px' } } }] as any } }] }
  };

  if (!hcReady) return <div className="w-full h-full grid place-items-center text-neutral-400">차트 모듈 로딩 중…</div>;
  if (loading)   return <div className="w-full h-full grid place-items-center text-neutral-400">데이터 불러오는 중…</div>;
  if (error)     return <div className="w-full h-full grid place-items-center text-rose-500">❌ 데이터 로드 실패: {error}</div>;
  if (!laws.length) return <div className="w-full h-full grid place-items-center text-neutral-400">데이터가 없습니다.</div>;

  return (
    <div className="w-full h-[340px] flex flex-col">
      <div className="rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 ">
        <HighchartsReact highcharts={Highcharts} options={options} immutable />
      </div>
      <div className="text-xs mt-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm text-neutral-800">
          {insightText}
        </div>
      </div>
    </div>
  );
}
