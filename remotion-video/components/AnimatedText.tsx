import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

type AnimatedTextProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  style?: React.CSSProperties;
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  fontSize = 48,
  color = "#ffffff",
  fontWeight = "bold",
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const translateY = interpolate(
    spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 80 } }),
    [0, 1],
    [30, 0]
  );

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontSize,
        color,
        fontWeight,
        fontFamily: "Inter, system-ui, sans-serif",
        ...style,
      }}
    >
      {text}
    </div>
  );
};
