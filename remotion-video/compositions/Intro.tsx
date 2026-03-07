import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { VALENTINE_COLORS } from "../theme";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gradient background animation
  const gradientAngle = interpolate(frame, [0, 750], [135, 180]);

  // Logo animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Subtitle fade
  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Bottom text
  const bottomOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${VALENTINE_COLORS.primary}, ${VALENTINE_COLORS.secondary}, ${VALENTINE_COLORS.accent})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Audio src={staticFile("voiceover/scene1.mp3")} />
      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          width: 120,
          height: 120,
          borderRadius: 30,
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          border: "2px solid rgba(255,255,255,0.3)",
        }}
      >
        <span style={{ fontSize: 60 }}>🎯</span>
      </div>

      {/* Title */}
      <AnimatedText
        text="SmartQueue"
        fontSize={80}
        color="#ffffff"
        delay={10}
        style={{ letterSpacing: -2 }}
      />

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          fontSize: 32,
          color: "rgba(255,255,255,0.85)",
          fontFamily: "Inter, system-ui, sans-serif",
          marginTop: 16,
          fontWeight: 400,
        }}
      >
        Gérez vos files d&apos;attente intelligemment
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: bottomOpacity,
          position: "absolute",
          bottom: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.6)",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          Mode d&apos;emploi complet
        </div>
        <div
          style={{
            width: 60,
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.4)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
