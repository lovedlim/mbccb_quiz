import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, alpha } from "./theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const ease = Easing.bezier(0.22, 0.8, 0.3, 1);

/** start 프레임부터 dur 프레임 동안 0 → 1 */
export function progress(frame: number, start: number, dur: number) {
  return interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: ease });
}

/** start 프레임에 튀어나오는 스프링. 시작 전에는 0 */
export function usePop(start: number, config = { damping: 14, stiffness: 150, mass: 0.8 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame < start ? 0 : spring({ frame: frame - start, fps, config });
}

// ── 답안지 ───────────────────────────────────────────────

export const Desk = ({ children }: { children?: ReactNode }) => (
  <AbsoluteFill
    style={{
      backgroundColor: C.desk,
      backgroundImage:
        "linear-gradient(rgba(27, 58, 143, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(27, 58, 143, 0.06) 1px, transparent 1px)",
      backgroundSize: "60px 60px",
      fontFamily: `${FONT.body}, sans-serif`,
      color: C.ink,
    }}
  >
    {children}
  </AbsoluteFill>
);

export const Sheet = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      position: "relative",
      background: C.paper,
      border: `1.5px solid ${C.ruleFaint}`,
      boxShadow: "0 2px 0 rgba(20, 22, 31, 0.04), 0 36px 70px -34px rgba(20, 22, 31, 0.45)",
      overflow: "hidden",
      ...style,
    }}
  >
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 10, background: C.rule }} />
    {children}
  </div>
);

export const SheetHead = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ borderBottom: `2px solid ${C.rule}`, padding: "52px 60px 34px", ...style }}>
    {children}
  </div>
);

export const SheetBody = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ padding: "40px 60px", ...style }}>{children}</div>
);

export const Label = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      fontFamily: `${FONT.mono}, ${FONT.body}, monospace`,
      fontSize: 22,
      fontWeight: 600,
      color: C.rule,
      letterSpacing: "0.02em",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Display = ({
  children,
  size = 72,
  color = C.ink,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) => (
  <div
    style={{
      fontFamily: FONT.display,
      fontSize: size,
      lineHeight: 1.15,
      letterSpacing: "-0.01em",
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

// ── 마킹 버블 ─────────────────────────────────────────────

export type BubbleState = "idle" | "marked" | "correct" | "wrong";

/** t 는 상태 전환 진행도(0→1). 칠해지는 순간을 보여줄 때 쓴다. */
export const BubbleRow = ({
  n,
  text,
  state = "idle",
  t = 1,
  note,
  fontSize = 28,
}: {
  n: number;
  text: ReactNode;
  state?: BubbleState;
  t?: number;
  note?: string;
  fontSize?: number;
}) => {
  const k = state === "idle" ? 0 : Math.min(1, Math.max(0, t));
  const tone = state === "correct" ? C.go : C.mark;
  const filled = state === "marked" || state === "correct";
  const d = fontSize * 1.7;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: fontSize * 0.75,
        padding: `${fontSize * 0.32}px ${fontSize * 0.42}px`,
        border: `2px solid ${alpha(tone, 0.3 * k)}`,
        background: state === "wrong" ? "transparent" : alpha(tone, 0.07 * k),
      }}
    >
      <div
        style={{
          flex: "none",
          width: d,
          height: d,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          border: `3px solid ${interpolateColors(k, [0, 1], [C.ruleFaint, tone])}`,
          background: filled ? interpolateColors(k, [0, 1], [C.paper, tone]) : C.paper,
          color: filled
            ? interpolateColors(k, [0, 1], [C.inkSoft, C.paper])
            : interpolateColors(k, [0, 1], [C.inkSoft, tone]),
          fontFamily: FONT.mono,
          fontSize: fontSize * 0.75,
          fontWeight: 600,
          textDecoration: state === "wrong" && k > 0.5 ? "line-through" : "none",
          transform: `scale(${filled ? 1 + 0.08 * k + 0.12 * Math.sin(Math.PI * k) : 1})`,
        }}
      >
        {n}
      </div>
      <div style={{ fontSize, lineHeight: 1.45 }}>
        {text}
        {note && k > 0 && (
          <span style={{ marginLeft: 14, fontSize: fontSize * 0.62, color: C.inkSoft, opacity: k }}>
            {note}
          </span>
        )}
      </div>
    </div>
  );
};

export const CodeBox = ({ ch, style }: { ch: string; style?: CSSProperties }) => (
  <div
    style={{
      width: 118,
      height: 146,
      display: "grid",
      placeItems: "center",
      border: `3px solid ${C.rule}`,
      background: C.paper,
      fontFamily: FONT.mono,
      fontWeight: 600,
      fontSize: 82,
      color: C.rule,
      ...style,
    }}
  >
    {ch}
  </div>
);

export const Button = ({
  children,
  variant = "rule",
  style,
}: {
  children: ReactNode;
  variant?: "rule" | "mark" | "ghost";
  style?: CSSProperties;
}) => {
  const bg = variant === "mark" ? C.mark : variant === "rule" ? C.rule : "transparent";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "18px 30px",
        border: `2px solid ${variant === "mark" ? C.mark : C.rule}`,
        background: bg,
        color: variant === "ghost" ? C.rule : C.paper,
        fontSize: 28,
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ── 레이아웃 ──────────────────────────────────────────────

/** 왼쪽에 장면 카피, 오른쪽에 앱 화면 */
export const Split = ({
  step,
  title,
  sub,
  children,
}: {
  step: string;
  title: string;
  sub: string;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const a = progress(frame, 2, 16);
  const b = progress(frame, 10, 18);
  const c = progress(frame, 20, 18);

  return (
    <Desk>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 0,
          bottom: 0,
          width: 620,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Label style={{ fontSize: 26, opacity: a, transform: `translateY(${(1 - a) * 16}px)` }}>
          {step}
        </Label>
        <Display
          size={86}
          style={{
            marginTop: 26,
            whiteSpace: "pre-line",
            wordBreak: "keep-all",
            opacity: b,
            transform: `translateY(${(1 - b) * 24}px)`,
          }}
        >
          {title}
        </Display>
        <div
          style={{
            marginTop: 34,
            fontSize: 32,
            lineHeight: 1.55,
            color: C.inkSoft,
            whiteSpace: "pre-line",
            opacity: c,
            transform: `translateY(${(1 - c) * 16}px)`,
          }}
        >
          {sub}
        </div>
        <div style={{ marginTop: 46, width: 120 * c, height: 8, background: C.mark }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 820,
          right: 120,
          top: 80,
          bottom: 80,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </Desk>
  );
};
