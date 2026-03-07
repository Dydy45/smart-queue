import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { VALENTINE_COLORS } from "../theme";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gradientAngle = interpolate(frame, [0, 750], [135, 200]);

  // Recap items
  const item1 = spring({ frame: frame - 30, fps, config: { damping: 15 } });
  const item2 = spring({ frame: frame - 50, fps, config: { damping: 15 } });
  const item3 = spring({ frame: frame - 70, fps, config: { damping: 15 } });

  // CTA
  const ctaScale = spring({ frame: frame - 100, fps, config: { damping: 10, stiffness: 80 } });

  // Bottom text
  const bottomOpacity = interpolate(frame, [130, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const recapItems = [
    { emoji: "⚙️", text: "Le propriétaire configure les services, postes et personnel", opacity: item1 },
    { emoji: "🎫", text: "Les clients créent leurs tickets en quelques secondes", opacity: item2 },
    { emoji: "👨‍⚕️", text: "Les employés traitent les tickets efficacement", opacity: item3 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${VALENTINE_COLORS.primary}, ${VALENTINE_COLORS.secondary}, ${VALENTINE_COLORS.accent})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <Audio src={staticFile("voiceover/scene9.mp3")} />
      {/* Title */}
      <AnimatedText
        text="En résumé"
        fontSize={52}
        color="#ffffff"
        delay={5}
        style={{ marginBottom: 48 }}
      />

      {/* Recap items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 56, width: 700 }}>
        {recapItems.map((item) => (
          <div
            key={item.text}
            style={{
              opacity: item.opacity,
              transform: `translateX(${interpolate(item.opacity, [0, 1], [-40, 0])}px)`,
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              padding: "16px 24px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <span style={{ fontSize: 32 }}>{item.emoji}</span>
            <span
              style={{
                fontSize: 20,
                color: "#fff",
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 500,
              }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div
        style={{
          transform: `scale(${interpolate(ctaScale, [0, 1], [0.8, 1])})`,
          opacity: ctaScale,
          background: "#fff",
          color: "#4f46e5",
          padding: "18px 48px",
          borderRadius: 12,
          fontSize: 22,
          fontWeight: "bold",
          fontFamily: "Inter, system-ui, sans-serif",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        Créer mon compte gratuitement
      </div>

      {/* Bottom text */}
      <div
        style={{
          opacity: bottomOpacity,
          position: "absolute",
          bottom: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", fontFamily: "Inter, system-ui, sans-serif" }}>
          smartqueue.com
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "Inter, system-ui, sans-serif" }}>
          Merci d&apos;avoir regardé cette vidéo !
        </div>
      </div>
    </AbsoluteFill>
  );
};
