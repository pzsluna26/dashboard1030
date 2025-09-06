"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

export default function NewsDetailPage() {
  const { category, date } = useParams() as { category: string; date: string };

  const [dayData, setDayData] = useState<NewsDayData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const formattedDate = `${date?.substring(0, 4)}년 ${date?.substring(4, 6)}월 ${date?.substring(6, 8)}일`;

  useEffect(() => {
    if (!category || !date) return;

    const fetchData = async () => {
      try {
        const res = await fetch("/law_data.json");
        if (!res.ok) throw new Error("law_data.json 로딩 실패");
        const json: LawData = await res.json();

        const decodedCategory = decodeURIComponent(category);
        const selected = json[decodedCategory]?.news?.[date] ?? null;

        if (!selected) {
          setErrorMessage("해당 카테고리 또는 날짜의 데이터를 찾을 수 없습니다.");
        } else {
          setDayData(selected);
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, date]);

  if (loading) return <p className="p-4">로딩 중...</p>;

  return (
    <main className="p-4 md:p-8 w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/news"
          className="text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          &larr; 뉴스 목록으로
        </Link>
        <h1 className="text-3xl font-bold mt-4">{decodeURIComponent(category)}</h1>
        <p className="text-xl text-gray-600">{formattedDate} 뉴스 기사</p>
      </div>

      {errorMessage ? (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{errorMessage}</div>
      ) : dayData ? (
        <div>
          <p className="mb-6 text-lg">
            총{" "}
            <span className="font-bold text-indigo-600">
              {dayData.count}
            </span>
            개의 기사 중 상위 {dayData.articles.length}개를 표시합니다.
          </p>
          <div className="space-y-6">
            {dayData.articles.map((article, index) => (
              <article
                key={index}
                className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h2 className="text-2xl font-semibold mb-2">{article.title}</h2>
                <p className="text-gray-700 leading-relaxed">{article.content}</p>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 bg-gray-100 p-4 rounded-lg">
          해당 날짜의 기사 데이터가 없습니다.
        </div>
      )}
    </main>
  );
}
