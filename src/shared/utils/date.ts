export const fmtKstDate = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d);

export const makeDefaultRange = (days = 14, endISO = '2025-08-13T23:59:59+09:00') => {
  const end = new Date(endISO);
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return { start: fmtKstDate(start), end: fmtKstDate(end) };
};
