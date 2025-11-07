import { useEffect, useMemo, useState } from 'react';
import { dashboardAPI } from '@/shared/api/dashboard';
import { makeDefaultRange } from '@/shared/utils/date';
import type { SocialBarWire } from '@/shared/types/dashboard';

export function useSocialBar(startDate?: string, endDate?: string) {
  const { start, end } = useMemo(() => {
    if (startDate && endDate) return { start: startDate, end: endDate };
    return makeDefaultRange(14);
  }, [startDate, endDate]);

  const [data, setData] = useState<SocialBarWire['data']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await dashboardAPI.getSocialBar({ start, end });
        if (!cancelled) setData(res.data || []);
      } catch (e:any) {
        if (!cancelled) {
          setError(e?.message || '로드 실패');
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [start, end]);

  return { data, loading, error, start, end };
}
