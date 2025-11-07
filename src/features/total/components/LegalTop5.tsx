'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useLegalTop5 } from '../hooks/useLegalTop5';

export default function LegalTop5({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  const { items, loading } = useLegalTop5(startDate, endDate);
  const topItems = useMemo(
    () => [...items].sort((a, b) => b.commentCount - a.commentCount).slice(0, 5),
    [items]
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!topItems.length) return;
    setActive(0);
    const id = setInterval(() => setActive((prev) => (prev + 1) % topItems.length), 2000);
    return () => clearInterval(id);
  }, [topItems]);

  if (loading) {
    return (
      <div className="h-full rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 p-4">
        <div className="text-sm  text-neutral-800">가장 핫한 법안 TOP 3</div>
        <div className="mt-1 text-xs text-neutral-500">데이터 로딩 중...</div>
      </div>
    );
  }
  if (!topItems.length) {
    return (
      <div className="h-full rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 p-4">
        <div className="text-sm text-neutral-800">가장 핫한 법안 TOP 3</div>
        <div className="mt-1 text-xs text-neutral-500">선택한 기간에 해당하는 데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md p-4 shadow-lg">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-1 text-sm text-neutral-600 relative group">
          가장 핫한 법안 TOP {topItems.length}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400 cursor-pointer group-hover:text-neutral-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
          <div className="absolute top-6 left-0 z-10 hidden group-hover:block w-[260px] text-[11px] text-neutral-800 bg-white border border-neutral-200 shadow-md rounded-md p-3">
            댓글 수 기준으로 가장 많은 여론의 관심이 집중된 법안 TOP {topItems.length}입니다.
          </div>
        </div>

        <div className="text-xs text-neutral-500">
          총 {topItems.reduce((sum, x) => sum + x.commentCount, 0).toLocaleString()}개 댓글
        </div>
      </div>

      <ol className="mt-3">
        {topItems.map((it, idx) => {
          const total = it.개정강화 + it.폐지완화 + it.현상유지;
          const p1 = Math.round((it.개정강화 / total) * 100);
          const p2 = Math.round((it.폐지완화 / total) * 100);
          const p3 = 100 - p1 - p2;
          const isActive = idx === active;

          return (
            <li
              key={`${it.law}-${idx}`}
              className={[
                'relative rounded-2xl p-4 transition-all transform cursor-pointer',
                isActive ? 'bg-white shadow-2xl scale-[1.02] ring-1 ring-black/10' : 'bg-white/50 opacity-60 grayscale',
              ].join(' ')}
              style={{ transitionDuration: '400ms' }}
            >
              <div className="flex items-center gap-3">
                <div className={['flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs shrink-0 text-white',
                  'bg-gradient-to-br from-sky-400 to-sky-600 drop-shadow-md',
                  !isActive && 'bg-neutral-400 drop-shadow-none',].join(' ')}>
                  {idx + 1}
                </div>

                <div className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
                  {it.law}
                </div>

                {it.hot === 'y' && idx < 3 && (
                  <span className="select-none rounded-full px-2 py-1 text-[11px] font-bold text-white shadow-sm"
                    style={{ background: 'linear-gradient(180deg, #fa7d57ff 0%, #f14e50ff 100%)', boxShadow: '0 4px 12px rgba(255,80,60,.25)' }}>
                    HOT
                  </span>
                )}

                <div className="ml-2 flex items-center gap-2">
                  <span className="tabular-nums text-[15px] font-semibold text-blue-600">
                    {it.commentCount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className="relative h-5 w-full overflow-hidden rounded-full bg-gradient-to-r from-neutral-200 to-neutral-300 shadow-inner">
                  <div className="absolute left-0 top-0 h-full" style={{
                    width: `${p1}%`, background: 'linear-gradient(to right, #fa6666cc, #FF8989)', boxShadow: 'inset 0 0 6px rgba(255, 119, 77, 0.5)', transition: 'width 800ms cubic-bezier(.22,.61,.36,1)',
                  }} />
                  <div className="absolute top-0 h-full" style={{
                    left: `${p1}%`, width: `${p2}%`, background: 'linear-gradient(to right, #a1c4fd, #c2e9fb)',
                    boxShadow: 'inset 0 0 6px rgba(100, 149, 237, 0.5)', transition: 'all 800ms cubic-bezier(.22,.61,.36,1)',
                  }} />
                  <div className="absolute top-0 h-full" style={{
                    left: `${p1 + p2}%`, width: `${p3}%`, background: 'linear-gradient(to right, #d3d3d3, #f5f5f5)',
                    boxShadow: 'inset 0 0 4px rgba(160, 160, 160, 0.4)', transition: 'all 800ms cubic-bezier(.22,.61,.36,1)',
                  }} />
                </div>

                <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #FF6666, #FF8989)' }} />
                      강화 {p1}%</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #a1c4fd, #c2e9fb)' }} />
                      완화 {p2}%</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #d3d3d3, #f5f5f5)' }} />
                      유지 {p3}%</span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
