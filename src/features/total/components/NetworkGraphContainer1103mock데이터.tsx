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
  // const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   if (!startDate || !endDate) return;

  //   const fetchData = async () => {
  //     try {
  //       const res = await fetch(
  //         `http://10.125.121.213:8080/api/dashboard/legal-network?start=${startDate}&end=${endDate}&period=daily_timeline`
  //       );
  //       const json: { nodes: Node[] } = await res.json();

  //       // 새 구조를 기반으로 시각화용 데이터 가공
  //       const nodes: GraphNode[] = [];
  //       const links: GraphLink[] = [];

  //       json.nodes.forEach((node) => {
  //         // 카테고리 노드 추가
  //         nodes.push({
  //           id: node.id,
  //           label: node.label,
  //           type: "category",
  //         });

  //         // 인시던트 노드 + 링크 추가
  //         node.incidents.forEach((incident, idx) => {
  //           const incidentId = `${node.id}-incident-${idx}`;

  //           nodes.push({
  //             id: incidentId,
  //             label: incident,
  //             type: "incident",
  //           });

  //           links.push({
  //             source: node.id,
  //             target: incidentId,
  //             value: 1,
  //           });
  //         });
  //       });

  //       setGraphData({ nodes, links });
  //     } catch (e) {
  //       console.error("❌ 네트워크 데이터 패치 실패:", e);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, [startDate, endDate]);

  // if (loading) return <div className="text-sm text-neutral-500 p-4">네트워크 데이터를 불러오는 중입니다...</div>;
  // if (!graphData) return <div className="text-sm text-neutral-500 p-4">데이터를 불러올 수 없습니다.</div>;

 const rawMock = {
    nodes: [
      {
        label: "정보관련법",
        description: "개인정보보호법, 정보통신망법 등 개인정보와 데이터 보호에 관한 법률",
        incidents: [
          {
            name: "개인정보 유출 사건",
            개정강화: {
              count: 450,
              opinions: [
                "개인정보보호법 처벌 수위를 대폭 강화해야 합니다",
                "기업의 개인정보 관리 의무를 더욱 엄격하게 규정해야 해요",
                "개인정보 유출 시 피해자 배상 기준을 명확히 해야 합니다",
                "개인정보처리자의 책임을 강화하고 감시 체계를 구축해야 해요",
                "개인정보보호 관련 교육 의무화와 인증제도 도입이 필요합니다",
              ],
            },
            폐지완화: {
              count: 120,
              opinions: [
                "과도한 규제로 인한 기업 부담을 줄여야 합니다",
                "개인정보보호법이 너무 복잡해서 간소화가 필요해요",
                "중소기업에게는 규제 완화 혜택을 줘야 합니다",
                "글로벌 경쟁력을 위해 일부 규제를 완화해야 해요",
                "혁신적인 서비스 개발을 위해 규제 샌드박스를 확대해야 합니다",
              ],
            },
            현상유지: {
              count: 230,
              opinions: [
                "현재 법률이 적절한 수준이라고 생각합니다",
                "급격한 변화보다는 점진적 개선이 필요해요",
                "기존 법률의 실효성을 먼저 검증해봐야 합니다",
                "현행 제도의 안정성을 유지하는 것이 중요해요",
                "법 개정보다는 집행력 강화가 우선이라고 봅니다",
              ],
            },
          },
          {
            name: "데이터 보호 강화 요구",
            개정강화: {
              count: 380,
              opinions: [
                "데이터 3법 개정으로 더 강력한 보호 체계를 만들어야 해요",
                "AI 시대에 맞는 새로운 데이터 보호 기준이 필요합니다",
                "국제 기준에 맞춰 데이터 보호 수준을 높여야 해요",
                "데이터 주체의 권리를 더욱 강화해야 합니다",
                "빅테크 기업에 대한 데이터 규제를 강화해야 해요",
              ],
            },
            폐지완화: {
              count: 90,
              opinions: [
                "데이터 경제 활성화를 위해 규제를 완화해야 합니다",
                "과도한 보호로 인한 혁신 저해를 막아야 해요",
                "데이터 활용도를 높이기 위한 유연성이 필요합니다",
                "국가 경쟁력을 위해 데이터 규제를 줄여야 해요",
                "스타트업 생태계를 위한 규제 완화가 필요합니다",
              ],
            },
            현상유지: {
              count: 180,
              opinions: [
                "현재 데이터 3법이 적절한 균형을 이루고 있어요",
                "성급한 개정보다는 현행법 정착이 우선입니다",
                "데이터 보호와 활용의 균형이 잘 맞춰져 있어요",
                "현재 제도로도 충분히 보호가 가능하다고 봅니다",
                "법 개정보다는 가이드라인 개선이 필요해요",
              ],
            },
          },
        ],
      },
      {
        label: "아동관련법",
        description: "아동복지법, 청소년보호법 등 아동과 청소년의 권익 보호에 관한 법률",
        incidents: [
          {
            name: "아동 온라인 안전 이슈",
            개정강화: { count: 320, opinions: ["…"] },
            폐지완화: { count: 80, opinions: ["…"] },
            현상유지: { count: 150, opinions: ["…"] },
          },
          {
            name: "온라인 게임 중독 문제",
            개정강화: { count: 280, opinions: ["…"] },
            폐지완화: { count: 110, opinions: ["…"] },
            현상유지: { count: 160, opinions: ["…"] },
          },
        ],
      },
      {
        label: "금융관련법",
        description: "은행법, 자본시장법 등 금융시장의 안정성과 투자자 보호에 관한 법률",
        incidents: [
          {
            name: "디지털 화폐 규제 논란",
            개정강화: { count: 290, opinions: ["…"] },
            폐지완화: { count: 180, opinions: ["…"] },
            현상유지: { count: 130, opinions: ["…"] },
          },
          {
            name: "핀테크 서비스 확산",
            개정강화: { count: 220, opinions: ["…"] },
            폐지완화: { count: 200, opinions: ["…"] },
            현상유지: { count: 180, opinions: ["…"] },
          },
        ],
      },
      {
        label: "안전관련법",
        description: "도로교통법, 식품안전법 등 국민의 생명과 안전을 보장하는 법률",
        incidents: [
          {
            name: "교통사고 예방 논의",
            개정강화: { count: 410, opinions: ["…"] },
            폐지완화: { count: 70, opinions: ["…"] },
            현상유지: { count: 190, opinions: ["…"] },
          },
          {
            name: "식품 안전 기준 강화",
            개정강화: { count: 350, opinions: ["…"] },
            폐지완화: { count: 60, opinions: ["…"] },
            현상유지: { count: 140, opinions: ["…"] },
          },
        ],
      },
    ],
  };
  return (
    <NetworkGraph
      // data={graphData}
         data={rawMock}
      startDate={startDate}
      endDate={endDate}
      maxArticles={5}
    />
  );
}
