import type { Metadata } from "next";
import { Black_Han_Sans, IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

// 답안지 헤더와 문항 번호에만 쓰는 전시용 서체
const display = Black_Han_Sans({
  variable: "--font-display",
  weight: "400",
  // next/font 폰트 목록에 korean 서브셋이 없다. subsets 를 생략하고
  // preload 를 끄면 한글 unicode-range 까지 함께 셀프호스팅된다.
  preload: false,
  display: "swap",
});

const body = IBM_Plex_Sans_KR({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

// 공유 코드·점수·시간처럼 자릿수가 보여야 하는 값
const code = IBM_Plex_Mono({
  variable: "--font-code",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "퀴즈팡",
  description: "주제만 정하면 AI가 문제를 냅니다. 코드 하나로 응시하고, 리더보드로 확인하세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${display.variable} ${body.variable} ${code.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
