'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEffect, useState } from 'react';

const COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'];

interface LawOpinionPieProps{
  lawName: string;
}

type LawData = Record<
  string,
  {
    news: Record<
      string,
      {
        count: number;
        article: {
          title: string;
          content: string;
        }[];
      }
    >;
    social: Record<string, number>;
  }
>;

export default function LawOpinionPie({lawName}:LawOpinionPieProps) {
  const [data, setData] = useState<LawData | null>(null);

  useEffect(() => {
    fetch('/law_data.json')
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data || !data['개인정보보호법']) {
    return <p className="text-gray-500 text-sm">데이터를 불러오는 중...</p>;
  }

  const chartData = Object.entries(data['개인정보보호법'].social).map(
    ([source, count]) => ({
      name: source,
      value: count,
    })
  );

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label
          >
            {chartData.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              fontSize: 12,
              fontFamily: 'sans-serif',
              borderRadius: 4,
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              fontSize: 12,
              fontFamily: 'sans-serif',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
