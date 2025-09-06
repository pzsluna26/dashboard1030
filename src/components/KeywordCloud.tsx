// components/KeywordCloud.tsx
'use client';

import React from 'react';

interface KeywordCloudProps {
  keywords: string[];
}

const COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'];

export default function KeywordCloud({ keywords }: KeywordCloudProps) {
  // 글자 크기 단계 설정 (간단한 시각 강조용)
  const fontSizes = [14, 16, 18, 20, 22, 26];

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center h-64 overflow-hidden bg-gray-50 rounded-lg border border-gray-100 p-4">
      {keywords.map((word, i) => (
        <span
          key={i}
          className="transition-all duration-200"
          style={{
            fontSize: `${fontSizes[i % fontSizes.length]}px`,
            fontWeight: i % 4 === 0 ? '700' : '500',
            color: COLORS[i % COLORS.length],
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}
