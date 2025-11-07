// KPI Summary
export type KpiSummaryWire = Record<string, {
  summary: {
    totalArticles: number;
    totalComments: number;
    newsGrowthRate: number;
    socialGrowthRate: number;
  };
  dailyData: Array<{ date: string; news: number; social: number }>;
}>;

// LegalTop5
export type LegalTop5Wire = Record<string, {
  law: string;
  개정강화: number;
  폐지완화: number;
  현상유지: number;
  commentCount: number;
  hot: 'y' | 'n';
}> | Array<{
  law: string;
  개정강화: number;
  폐지완화: number;
  현상유지: number;
  commentCount: number;
  hot: 'y' | 'n';
}>;

// Network Graph
export type NetworkGraphWire = {
  nodes: Array<{
    id?: string;
    label: string;
    description?: string;
    incidents?: Array<{
      name: string;
      개정강화: { count: number; opinions: string[] };
      폐지완화?: { count: number; opinions: string[] };
      폐지약화?: { count: number; opinions: string[] };
      현상유지: { count: number; opinions: string[] };
    }>;
  }>;
};

// Social Bar
export type SocialBarWire = {
  data: Array<{ category: string; 개정강화: number; 폐지완화: number; 현상유지: number }>;
};

// Stance Area
export type StanceAreaWire = {
  data: Array<{ date: string; 개정강화: number; 폐지완화: number; 현상유지: number }>;
};

// Heatmap
export type HeatmapWire = {
  laws: Array<{ name: string; 개정강화: number; 폐지완화: number; 현상유지: number }>;
};
