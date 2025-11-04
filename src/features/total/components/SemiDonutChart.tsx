'use client';
import React from "react";

interface SemiDonutChartProps {
  counts: {
    agree: number;
    repeal: number;
    neutral: number;
  };
  onSelect: (key: "agree" | "repeal" | "disagree") => void;
  selected: "agree" | "repeal" | "disagree";
}

const colorMap = {
  agree: "#10B981",      // green
  repeal: "#EF4444",     // red
  disagree: "#6366F1",   // blue
};

const labelMap = {
  agree: "개정강화",
  repeal: "폐지완화",
  disagree: "현상유지",
};

export default function SemiDonutChart({ counts, onSelect, selected }: SemiDonutChartProps) {
  const total = Math.max(1, counts.agree + counts.repeal + counts.neutral);
  const radius = 50;
  const thickness = 14;
  const center = radius + 2;
  const circumference = Math.PI * radius;

  const angles = {
    agree: (counts.agree / total) * 180,
    repeal: (counts.repeal / total) * 180,
    disagree: (counts.neutral / total) * 180,
  };

  let startAngle = 0;

  const arcs = (Object.entries(angles) as [keyof typeof angles, number][]).map(([key, angle]) => {
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;

    const startX = center + radius * Math.cos((Math.PI * startAngle) / 180);
    const startY = center + radius * Math.sin((Math.PI * startAngle) / 180);
    const endX = center + radius * Math.cos((Math.PI * endAngle) / 180);
    const endY = center + radius * Math.sin((Math.PI * endAngle) / 180);

    const path = `
      M ${startX} ${startY}
      A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}
    `;

    const current = (
      <path
        key={key}
        d={path}
        fill="none"
        stroke={colorMap[key as keyof typeof colorMap]}
        strokeWidth={thickness}
        onClick={() => onSelect(key as "agree" | "repeal" | "disagree")}
        style={{ cursor: "pointer", opacity: selected === key ? 1 : 0.5 }}
      />
    );

    startAngle = endAngle;
    return current;
  });

  return (
    <svg width={center * 2} height={radius + thickness + 4} viewBox={`0 0 ${center * 2} ${radius + thickness + 4}`}>
      {arcs}
    </svg>
  );
}
