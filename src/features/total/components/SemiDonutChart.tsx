// components/SemiPieChart.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";

export type SliceType = "agree" | "repeal" | "neutral";

interface SliceData {
  type: SliceType;
  count: number;
  color: string;
  label: string;
}

interface SemiPieChartProps {
  data: SliceData[];
  onSelect?: (type: SliceType) => void;
  selected?: SliceType;
  radius?: number;
}

const defaultColors: Record<SliceType, string> = {
  agree: "#34d399", // emerald
  repeal: "#f97316", // orange
  neutral: "#9ca3af", // gray
};

const defaultLabels: Record<SliceType, string> = {
  agree: "개정강화",
  repeal: "폐지완화",
  neutral: "현상유지",
};

export default function SemiPieChart({
  data,
  onSelect,
  selected,
  radius = 80,
}: SemiPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const centerX = radius;
  const centerY = radius;
  const viewBoxSize = radius * 2;

  let cumulativeAngle = 0;

  const toRadians = (deg: number) => (Math.PI / 180) * deg;

  const getPath = (startAngle: number, angle: number) => {
    const x1 = centerX + radius * Math.cos(toRadians(startAngle));
    const y1 = centerY + radius * Math.sin(toRadians(startAngle));
    const x2 = centerX + radius * Math.cos(toRadians(startAngle + angle));
    const y2 = centerY + radius * Math.sin(toRadians(startAngle + angle));

    const largeArcFlag = angle > 180 ? 1 : 0;

    return [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");
  };

  return (
    <svg
      width={viewBoxSize}
      height={radius + 10}
      viewBox={`0 0 ${viewBoxSize} ${radius + 10}`}
    >
      {data.map((slice, i) => {
        const angle = (slice.count / total) * 180;
        const path = getPath(cumulativeAngle, angle);
        const isActive = selected === slice.type;
        cumulativeAngle += angle;

        return (
          <path
            key={slice.type}
            d={path}
            fill={slice.color}
            opacity={isActive ? 1 : 0.6}
            stroke="#fff"
            strokeWidth={2}
            onClick={() => onSelect?.(slice.type)}
            cursor="pointer"
          />
        );
      })}
    </svg>
  );
}
