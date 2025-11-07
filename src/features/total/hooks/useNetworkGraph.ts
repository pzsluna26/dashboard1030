import { useEffect, useMemo, useState } from 'react';
import { dashboardAPI } from '@/shared/api/dashboard';
import { makeDefaultRange } from '@/shared/utils/date';
import type { NetworkGraphWire } from '@/shared/types/dashboard';

export type Incident = {
  name: string;
  개정강화: { count: number; opinions: string[] };
  폐지완화?: { count: number; opinions: string[] };
  폐지약화?: { count: number; opinions: string[] };
  현상유지: { count: number; opinions: string[] };
};

export type CategoryNode = {
  label: string;
  description: string;
  incidents: Incident[];
};

export type GraphData = { nodes: CategoryNode[] };

export function useNetworkGraph(startDate?: string, endDate?: string) {
  const { start, end } = useMemo(() => {
    if (startDate && endDate) return { start: startDate, end: endDate };
    return makeDefaultRange(14);
  }, [startDate, endDate]);

  const [data, setData] = useState<GraphData|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const wire = await dashboardAPI.getNetworkGraph({ start, end }) as NetworkGraphWire;
        const graph: GraphData = { nodes: wire?.nodes?.map(n => ({
          label: n.label,
          description: n.description || '',
          incidents: (n.incidents || []) as any,
        })) || [] };
        if (!cancelled) setData(graph);
      } catch (e:any) {
        if (!cancelled) {
          setError(e?.message || '로드 실패');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [start, end]);

  return { data, loading, error, start, end };
}
