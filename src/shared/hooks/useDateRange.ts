import { useMemo } from 'react';
import { makeDefaultRange } from '@/shared/utils/date';

export function useDateRange(startDate?: string, endDate?: string, defaultDays = 14) {
  return useMemo(() => {
    if (startDate && endDate) return { start: startDate, end: endDate };
    return makeDefaultRange(defaultDays);
  }, [startDate, endDate, defaultDays]);
}
