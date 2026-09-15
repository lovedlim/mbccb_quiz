import type { ComponentType, ReactNode } from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Desk, clamp } from "./ui";
import { Opening } from "./scenes/Opening";
import { Create } from "./scenes/Create";
import { ShareCode } from "./scenes/ShareCode";
import { Play } from "./scenes/Play";
import { Result } from "./scenes/Result";
import { Ending } from "./scenes/Ending";

// 30fps 기준 프레임 수. 합계 1350 = 45초
const SCENES: { Scene: ComponentType; frames: number }[] = [
  { Scene: Opening, frames: 150 },
  { Scene: Create, frames: 270 },
  { Scene: ShareCode, frames: 180 },
  { Scene: Play, frames: 270 },
  { Scene: Result, frames: 270 },
  { Scene: Ending, frames: 210 },
];

export const TOTAL_FRAMES = SCENES.reduce((sum, s) => sum + s.frames, 0);

const FADE = 10;

/** 장면 사이는 빈 책상으로 잠깐 내려앉았다가 다음 장면이 올라온다. */
const Fade = ({
  frames,
  fadeIn,
  fadeOut,
  children,
}: {
  frames: number;
  fadeIn: boolean;
  fadeOut: boolean;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(
    fadeIn ? interpolate(frame, [0, FADE], [0, 1], clamp) : 1,
    fadeOut ? interpolate(frame, [frames - FADE, frames], [1, 0], clamp) : 1,
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const Intro = () => {
  let from = 0;
  return (
    <AbsoluteFill>
      <Desk />
      {SCENES.map(({ Scene, frames }, i) => {
        const seq = (
          <Sequence key={i} from={from} durationInFrames={frames}>
            <Fade frames={frames} fadeIn={i > 0} fadeOut={i < SCENES.length - 1}>
              <Scene />
            </Fade>
          </Sequence>
        );
        from += frames;
        return seq;
      })}
    </AbsoluteFill>
  );
};
