import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill } from "remotion";

type FadeTransitionProps = {
  children: React.ReactNode;
  fadeInDuration?: number;
  fadeOutStart?: number;
};

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  children,
  fadeInDuration = 15,
  fadeOutStart,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeOutBegin = fadeOutStart ?? durationInFrames - 15;

  const opacity = interpolate(
    frame,
    [0, fadeInDuration, fadeOutBegin, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};
