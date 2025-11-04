"use client";

import { useEffect, useState } from "react";
import NetworkGraph from "./NetworkGraph";

interface Node {
  id: string;
  label: string;
  incidents: string[] | any[];
}

interface GraphNode {
  id: string;
  label: string;
  type: "category" | "incident";
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

const mockGraphData: { nodes: Node[] } = {
  nodes: [
    {
      id: "privacy",
      label: "개인정보보호법",
      incidents: [
        {
          name: "얼굴 인식 데이터 저장 논란",
          개정강화: { count: 12, opinions: ["얼굴 정보는 민감 정보입니다.", "감시 사회 우려됩니다."] },
          폐지완화: { count: 4, opinions: ["기술 발전에 필요", "효율성 향상"] },
          현상유지: { count: 3, opinions: ["기존 법으로 충분함"] },
        },
        {
          name: "이메일 마케팅 개인정보 활용",
          개정강화: { count: 7, opinions: ["동의 절차 강화 필요"] },
          폐지완화: { count: 5, opinions: ["기업 자율 필요"] },
          현상유지: { count: 2, opinions: [] },
        },
      ],
    },
    {
      id: "finance",
      label: "전자금융거래법",
      incidents: [
        {
          name: "가상화폐 거래 추적",
          개정강화: { count: 10, opinions: ["불법 자금 추적 필요", "투명성 보장"] },
          폐지완화: { count: 8, opinions: ["과도한 규제 우려"] },
          현상유지: { count: 5, opinions: ["현행 법으로 충분"] },
        },
      ],
    },
  ],
};

export default function NetworkGraphContainer({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const [graphData, setGraphData] = useState<{ nodes: Node[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // fallback 날짜 계산
  const fallbackEnd = new Date("2025-08-13T23:59:59+09:00");
  const fallbackStart = new Date(fallbackEnd);
  fallbackStart.setDate(fallbackEnd.getDate() - 13);
  const format = (d: Date) => d.toISOString().split("T")[0];

  const localStartDate = startDate || format(fallbackStart);
  const localEndDate = endDate || format(fallbackEnd);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://10.125.121.213:8080/api/dashboard/legal-network?start=${localStartDate}&end=${localEndDate}`
        );
        const json = await res.json();

        // ✅ 유효성 검사
        if (!json.nodes || !Array.isArray(json.nodes)) {
          throw new Error("Invalid network data format");
        }

        setGraphData(json);
      } catch (e) {
        console.warn("❌ 네트워크 fetch 실패. mock 데이터 사용", e);
        setGraphData(mockGraphData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [localStartDate, localEndDate]);

  if (loading) return <div className="text-sm text-neutral-500 p-4">네트워크 데이터를 불러오는 중입니다...</div>;
  if (!graphData) return <div className="text-sm text-neutral-500 p-4">데이터를 불러올 수 없습니다.</div>;

  return (
    <NetworkGraph
      data={graphData}
      startDate={localStartDate}
      endDate={localEndDate}
      maxArticles={5}
    />
  );
}
