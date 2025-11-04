"use client";
import { useEffect, useState } from "react";
import NetworkGraph from "./NetworkGraph";

interface Node {
  id: string;
  label: string;
  incidents: string[];
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

export default function NetworkGraphContainer({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ fallback 날짜 계산
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
        const json: { nodes: Node[] } = await res.json();

        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];

        json.nodes.forEach((node) => {
          // 카테고리 노드 추가
          nodes.push({
            id: node.id,
            label: node.label,
            type: "category",
          });

          // 인시던트 노드 + 링크 추가
          node.incidents.forEach((incident, idx) => {
            const incidentId = `${node.id}-incident-${idx}`;

            nodes.push({
              id: incidentId,
              label: incident,
              type: "incident",
            });

            links.push({
              source: node.id,
              target: incidentId,
              value: 1,
            });
          });
        });

        setGraphData({ nodes, links });
      } catch (e) {
        console.error("네트워크 데이터 패치 실패:", e);
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
