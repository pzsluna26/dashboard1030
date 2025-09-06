'use client';

import React, { useEffect, useState } from 'react';
import GraphCard from '@/components/graphCard';
import LawOpinionPie from '@/components/LawOpinionPie';

interface Article {
  title: string;
  content: string;
}

interface NewsDayData {
  count: number;
  articles: Article[];
}

interface NewsData {
  [date: string]: NewsDayData;
}

interface SocialData {
  blog: number;
  community: number;
  twitter: number;
  insta: number;
}

interface LawCategoryData {
  news: NewsData;
  social: SocialData;
}

interface LawData {
  [category: string]: LawCategoryData;
}

export default function Private() {
  const [data, setData] = useState<LawData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/law_data.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("데이터 로딩 실패:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-4">로딩 중...</p>;
  if (!data || !data["개인정보보호법"])
    return <p className="p-4 text-red-500">데이터를 불러오지 못했습니다.</p>;

  const lawData = data["개인정보보호법"];

  return (
    <div className="bg-gray-50 rounded-xl w-full min-h-screen flex flex-col items-center">
      
      {/* 그래프 카드 */}
      {/* props = "법안명" */}
      <div className="rounded-xl border border-gray-200 shadow-sm mt-10 w-full max-w-5xl">
        <GraphCard title="개인정보보호법" data={lawData.news} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 w-full max-w-5xl">
        {/* 여론 카드 */}
        {/* props = "법안명" */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className='flex justify-between'>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">여론</h2>
            <span className='text-lg mb-4 text-gray-800'>찬성 30% 반대 50% 중립 20%</span>
          </div>
          <LawOpinionPie lawName='개인정보보호법' />
        </div>

        {/* 피크뉴스 카드 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">피크뉴스</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>
              <strong>“개인정보보호법 개정 논란”</strong>
              <p>정부의 데이터 정책에 시민단체 반발 이어져</p>
            </li>
            <li>
              <strong>“AI 기업, 개인정보 수집 과잉 우려”</strong>
              <p>IT 업계 자율 규제 필요성 대두</p>
            </li>
            <li>
              <strong>“AI 기업, 개인정보 수집 과잉 우려”</strong>
              <p>IT 업계 자율 규제 필요성 대두</p>
            </li>
            <li>
              <strong>“개인정보보호법 개정 논란”</strong>
              <p>정부의 데이터 정책에 시민단체 반발 이어져</p>
            </li>
            <li>
              <strong>“AI 기업, 개인정보 수집 과잉 우려”</strong>
              <p>IT 업계 자율 규제 필요성 대두</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
