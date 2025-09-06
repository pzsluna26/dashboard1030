'use client';

import Link from "next/link";

const categories = [
  { name: "개인정보보호법", href: "/private" },
  { name: "아동복지법", href: "/child" },
  { name: "중대재해처벌법", href: "/safety" },
  { name: "자본시장법", href: "/finance" },
];

export default function Home() {
  return (
    <div className="grid grid-cols-10 h-screen w-screen">
      {/* 왼쪽 카테고리 (2/10) */}
      <div className="col-span-2 flex flex-col justify-center items-center bg-gray-100 border-r border-gray-300 h-full relative z-10">
        <ul className="space-y-8 text-xl font-semibold text-gray-600">
          {categories.map((cat) => (
            <li key={cat.name}>
              <Link
                href={cat.href}
                className="hover:text-gray-800 transition-colors"
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 오른쪽 배경 비디오 (8/10) */}
      {/* relative: 절대위치 */}
      <div className="col-span-8 relative h-full w-full overflow-hidden">
        <video
          src="/video/video1.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full"
        />
      </div>
    </div>
  );
}
