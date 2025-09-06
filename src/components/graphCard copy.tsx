// 파란막대그래프2

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'];

interface GraphCardProps {
  title: string;
  data: {
    [date: string]: {
      count: number;
    };
  };
}

export default function GraphCard({ title, data }: GraphCardProps) {
  const chartData = Object.entries(data).map(([date, value]) => ({
    date,
    count: value.count,
  }));

  return (
    <div className="bg-white p-4 rounded-lg w-full">
      <h2 className="text-lg font-semibold mb-4 text-center text-gray-700 mb-10">
        {title}
      </h2>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{ fontSize: '12px' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Bar
              dataKey="count"
              fill={COLORS[0]}
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}          // 애니메이션 활성화
              animationDuration={1500}           // 애니메이션 시간 (1.5초)
              animationEasing="ease-in-out"     // 부드러운 easing 효과
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
