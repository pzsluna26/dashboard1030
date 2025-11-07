'use client';
import { useNetworkGraph } from '../hooks/useNetworkGraph';
import NetworkGraph from './NetworkGraph';

export default function NetworkGraphContainer({
  startDate, endDate, maxArticles = 5,
}: { startDate?: string; endDate?: string; maxArticles?: number; }) {
  const { data, loading, error, start, end } = useNetworkGraph(startDate, endDate);

  if (loading) return <div className="text-sm text-neutral-500 p-4">네트워크 데이터를 불러오는 중입니다...</div>;
  if (error) return <div className="text-sm text-neutral-500 p-4">데이터를 불러올 수 없습니다.</div>;
  if (!data) return <div className="text-sm text-neutral-500 p-4">데이터를 불러올 수 없습니다.</div>;

  return <NetworkGraph data={data} startDate={start} endDate={end} maxArticles={maxArticles} />;
}
