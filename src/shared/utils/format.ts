export const nfKR = new Intl.NumberFormat('ko-KR');

export const formatKRDateHyphenToDots = (d?: string) => {
  if (!d) return '';
  const [y, m, dd] = d.split('-');
  return `${y}.${m}.${dd}`;
};
