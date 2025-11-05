"use client";
import React from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

interface HalfPieChartProps {
  data: {
    label: string;
    value: number;
    key: "agree" | "repeal" | "disagree";
  }[];
  onSelect: (key: "agree" | "repeal" | "disagree") => void;
  activeKey?: "agree" | "repeal" | "disagree";
}

const COLORS = {
  agree: "#34d399", // 개정강화
  repeal: "#f97316", // 폐지완화
  disagree: "#94a3b8", // 현상유지
};

export default function HalfPieChart({ data, onSelect, activeKey }: HalfPieChartProps) {
  // 유효 데이터 (0값은 제외)
  const visibleData = data.filter((d) => d.value > 0);

  return (
    <div className="w-full flex flex-col items-center">
      <PieChart width={260} height={160}>
        <Pie
          data={visibleData}
          cx={130}
          cy={120}
          startAngle={180}
          endAngle={0}
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          isAnimationActive={true}
          onClick={(entry) => onSelect(entry.key)} // ✅ slice 클릭 시 onSelect 호출
        >
          {visibleData.map((entry) => (
            <Cell
              key={entry.key}
              fill={COLORS[entry.key]}
              stroke="#fff"
              strokeWidth={2}
              opacity={activeKey === entry.key ? 1 : 0.6}
              cursor="pointer"
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(val: number, name) => [`${val}건`, name]}
          labelFormatter={() => ""}
        />
      </PieChart>

      {/* 범례 */}
      <div className="flex justify-center gap-4 text-xs mt-1">
        {data.map((d) => (
          <div
            key={d.key}
            onClick={() => onSelect(d.key)}
            className={`flex items-center gap-1 cursor-pointer ${
              activeKey === d.key ? "text-emerald-600 font-semibold" : "text-neutral-600"
            }`}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[d.key] }}
            />
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
