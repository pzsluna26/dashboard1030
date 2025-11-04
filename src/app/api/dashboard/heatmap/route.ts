import { NextResponse } from "next/server";

// 백엔드 베이스 URL 설정 순서:
// 1) API_BASE_URL
// 2) NEXT_PUBLIC_API_BASE_URL
// 3) 기본값 (기존 하드코드 유지)
const BASE =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://10.125.121.213:8080";

export async function GET() {
  const upstream = `${BASE.replace(/\/$/, "")}/api/dashboard/heatmap`;
  const MOCK = {
    laws: [
      { name: "개인정보보호법",   개정강화: 45, 폐지완화: 25, 현상유지: 30 },
      { name: "정보통신망법",     개정강화: 40, 폐지완화: 30, 현상유지: 30 },
      { name: "전자상거래법",     개정강화: 50, 폐지완화: 20, 현상유지: 30 },
      { name: "클라우드컴퓨팅법",  개정강화: 35, 폐지완화: 35, 현상유지: 30 },
      { name: "데이터3법",       개정강화: 55, 폐지완화: 15, 현상유지: 30 },
      { name: "AI 기본법",        개정강화: 60, 폐지완화: 10, 현상유지: 30 },
      { name: "온라인플랫폼법",    개정강화: 42, 폐지완화: 28, 현상유지: 30 },
      { name: "디지털플랫폼법",    개정강화: 38, 폐지완화: 32, 현상유지: 30 },
    ],
  };
  try {
    console.log(`[api] GET /api/dashboard/heatmap -> ${upstream}`);
    const res = await fetch(upstream, { cache: "no-store" });
    if (!res.ok) {
      console.warn(`[api] upstream non-OK: ${res.status} ${res.statusText}. Falling back to mock.`);
      return NextResponse.json(MOCK, { status: 200, headers: { "x-proxy-fallback": "1", "x-upstream-status": String(res.status) } });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error(`[api] upstream error: ${e?.message || e}. Falling back to mock.`);
    return NextResponse.json(MOCK, { status: 200, headers: { "x-proxy-fallback": "1", "x-upstream-error": e?.message || "error" } });
  }
}
