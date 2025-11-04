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
          `http://10.125.121.213:8080/api/dashboard/network-graph?start=${localStartDate}&end=${localEndDate}`
        );
        const json: { nodes: Node[] } = await res.json();

        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];

       json.nodes.forEach((node, nodeIdx) => {
  // ⚠️ 서버 데이터에는 id가 없으므로 label을 이용해서 id를 만들어야 함
  const nodeId = `node-${nodeIdx}`; // 또는 slugify(node.label)

  // 법조항 노드 추가
  nodes.push({
    id: nodeId,
    label: node.label, // 법조항 이름
    type: "category",
  });

  // 사건 노드 + 링크 추가
  node.incidents.forEach((incident, idx) => {
    const incidentId = `${nodeId}-incident-${idx}`;
    const label =
      typeof incident === "string"
        ? incident
        : incident.name || `incident-${idx}`;

    nodes.push({
      id: incidentId,
      label, // 사건 이름
      type: "incident",
    });

    links.push({
      source: nodeId, // label 기반으로 만든 id
      target: incidentId,
      value: 1,
    });
  });
});

        console.log("json", json)
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
