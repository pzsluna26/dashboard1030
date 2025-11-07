import { apiClient } from './client';
import {
  KpiSummaryWire,
  LegalTop5Wire,
  NetworkGraphWire,
  SocialBarWire,
  StanceAreaWire,
  HeatmapWire,
} from '@/shared/types/dashboard';

export const dashboardAPI = {
  getKpiSummary: (params: { start: string; end: string; period: string }) =>
    apiClient.get<KpiSummaryWire>('/dashboard/kpi-summary', { params }),

  getLegalTop5: (params: { start: string; end: string }) =>
    apiClient.get<LegalTop5Wire>('/dashboard/legal-top5', { params }),

  getNetworkGraph: (params: { start: string; end: string }) =>
    apiClient.get<NetworkGraphWire>('/dashboard/network-graph', { params }),

  getSocialBar: (params: { start: string; end: string }) =>
    apiClient.get<SocialBarWire>('/dashboard/social-bar', { params }),

  getStanceArea: (params: { start: string; end: string }) =>
    apiClient.get<StanceAreaWire>('/dashboard/stance-area', { params }),

  getHeatmap: (params: { start: string; end: string }) =>
    apiClient.get<HeatmapWire>('/dashboard/heatmap', { params }),
};
