// 카테고리 레이블
export const CATEGORY_TITLE: Record<string, string> = {
  privacy: '개인정보관련법',
  child: '아동복지법',
  safety: '중대재해처벌법',
  finance: '금융관련법',
};

// 백엔드 key -> 카테고리 매핑
export const KPI_KEY_MAPPING: Record<string, keyof typeof CATEGORY_TITLE> = {
  '개인정보보호법,정보통신망법': 'privacy',
  '자본시장법,특정금융정보법,전자금융거래법,전자증권법,금융소비자보호법': 'finance',
  '아동복지법': 'child',
  '중대재해처벌법': 'safety',
};

// 소셜바 카테고리 포맷
export function formatCategory(value: string): string {
  if (value === '자본시장법,특정금융정보법,전자금융거래법,전자증권법,금융소비자보호법') {
    return '금융관련법';
  }
  if (value === '개인정보보호법,정보통신망법') {
    return '개인정보관련법';
  }
  return value;
}
