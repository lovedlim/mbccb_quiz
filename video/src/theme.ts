import { loadFont as loadDisplay } from "@remotion/google-fonts/BlackHanSans";
import { loadFont as loadBody } from "@remotion/google-fonts/IBMPlexSansKR";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

export const FPS = 30;

// 앱(src/app/globals.css)의 OMR 답안지 팔레트를 그대로 쓴다.
export const C = {
  paper: "#fbfaf7",
  desk: "#e7ebf2",
  ink: "#14161f",
  inkSoft: "#5c6273",
  rule: "#1b3a8f",
  ruleFaint: "#c9d3e8",
  mark: "#e8452e",
  go: "#0f8f68",
};

// 앱과 같은 서체. 한글 서브셋은 파일이 많으므로 쓰는 굵기만 불러온다.
export const FONT = {
  display: loadDisplay("normal", { weights: ["400"], subsets: ["korean", "latin"] }).fontFamily,
  body: loadBody("normal", { weights: ["400", "600"], subsets: ["korean", "latin"] }).fontFamily,
  mono: loadMono("normal", { weights: ["500", "600"], subsets: ["latin"] }).fontFamily,
};

export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
