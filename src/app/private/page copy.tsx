'use client';

import React from 'react'
import {useState,useEffect} from 'react'
import Link from 'next/link'
import GraphCard from '@/components/graphCard';

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
  if (!data || !data["개인정보보호법"]) return <p className="p-4 text-red-500">데이터를 불러오지 못했습니다.</p>;

  const lawData = data["개인정보보호법"];


  const categories = Object.keys(data);
  return (
     <div className="border border-gray-300 rounded-xl w-full min-h-screen flex flex-col items-center">
      <div className="mt-10 p-10 w-full max-w-4xl">
        <GraphCard title="개인정보보호법" data={lawData.news} />
      </div>

      <div className="grid grid-cols-2 w-full max-w-4xl mt-5 gap-4 px-4">
        <div className="border p-4">
          <h2 className="font-semibold mb-2">여론</h2>
          <p>찬성 반대 중립</p>
          <p>키워드</p>
        </div>
        <div className="border p-4">
          <h2 className="font-semibold mb-2">피크뉴스</h2>
          <p>제목</p>
          <p>내용</p>
        </div>
      </div>
    </div>
  )
}
