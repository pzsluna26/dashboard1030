// 파란 곡선그래프

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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
    <div className="bg-white p-6 rounded-xl w-full shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-6 text-center text-gray-700">
        {title}
      </h2>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{
                fontWeight: 'bold',
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={COLORS[0]}
              strokeWidth={2.5}
              dot={false} // ✅ 정점 숨김
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
