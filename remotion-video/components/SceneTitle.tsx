import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { VALENTINE_COLORS } from "../theme";

type SceneTitleProps = {
  step: string;
  title: string;
  delay?: number;
};

export const SceneTitle: React.FC<SceneTitleProps> = ({ step, title, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const scale = interpolate(progress, [0, 1], [0.8, 1]);

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 80,
        opacity,
        transform: `scale(${scale})`,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          background: VALENTINE_COLORS.primary,
          color: "#fff",
          padding: "8px 20px",
          borderRadius: 8,
          fontSize: 20,
          fontWeight: "bold",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {step}
      </div>
      <span
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "#1e293b",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {title}
      </span>
    </div>
  );
};
