export function pct(n: number, t: number) {
  return t > 0 ? +(Math.round((n / t) * 1000) / 10).toFixed(1) : 0;
}
