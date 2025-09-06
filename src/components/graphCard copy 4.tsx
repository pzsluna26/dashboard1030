// 소히 그래프

"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
} from "recharts";
import { useRouter } from "next/navigation";

interface NewsDayData {
  count: number;
  articles: { title: string; content: string }[];
}

interface NewsData {
  [date: string]: NewsDayData;
}

interface GraphCardProps {
  title: string;
  data: NewsData;
}

export default function GraphCard({ title, data }: GraphCardProps) {
  const router = useRouter();

  // 전달받은 객체(data)를 차트 라이브러리가 사용할 수 있는 배열 형태로 변환합니다.
  const chartData = Object.entries(data)
    .map(([date, dayData]) => ({
      DATE: date, // "20240905"
      COUNT: dayData.count, // 뉴스 개수
      // X축에 표시될 날짜 형식 (YYYY-MM-DD)
      formattedDATE: `${date.substring(0, 4)}-${date.substring(
        4,
        6
      )}-${date.substring(6, 8)}`,
    }))
    // 날짜순으로 정렬하여 차트가 시간 순서대로 그려지도록 합니다.
    .sort((a, b) => a.DATE.localeCompare(b.DATE));

  // 차트의 막대를 클릭했을 때 호출될 함수
  const handleBarClick = (payload: any) => {
    if (payload && payload.DATE) {
      const selectedDate = payload.DATE;
      // 동적 라우팅을 이용해 상세 페이지로 이동
      router.push(`/news/${encodeURIComponent(title)}/${selectedDate}`);
    }
  };

  return (
    <div className="border-2 border-indigo-200 rounded-2xl p-4 shadow-lg w-full">
      <h2 className="text-lg font-bold mb-4 text-center truncate">{title}</h2>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedDATE" fontSize={12} />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="COUNT" // 'COUNT' 키를 사용하여 그래프를 그립니다.
              stroke="#8884d8"
              fill="#8884d8"
            />
            {/* 클릭 이벤트를 감지하기 위한 투명한 Bar */}
            <Bar dataKey="COUNT" onClick={handleBarClick} fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}