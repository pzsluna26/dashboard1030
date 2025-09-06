import { notFound } from 'next/navigation';

// 이 페이지는 URL 구조를 완성하기 위해 존재합니다.
// 사용자가 이 경로로 직접 접근할 경우 404 페이지를 반환합니다.
export default function CategoryPage() {
  return notFound();
}
