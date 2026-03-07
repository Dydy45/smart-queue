import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Audio,
  staticFile,
} from "remotion";
import { VALENTINE_COLORS } from "../theme";

export const SolutionReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Dark screen with "Il existe une solution" (0-40)
  const solutionTextOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const solutionTextScale = interpolate(frame, [5, 20], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: Flash transition (40-50)
  const flashOpacity = interpolate(frame, [38, 42, 48, 52], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 3: SmartQueue logo reveal (50+)
  const isRevealed = frame > 48;
  const logoScale = spring({
    frame: frame - 50,
    fps,
    config: { damping: 10, stiffness: 60 },
  });

  const taglineOpacity = interpolate(frame, [70, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [70, 85], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 4: Feature pills (90+)
  const pill1 = spring({ frame: frame - 95, fps, config: { damping: 15 } });
  const pill2 = spring({ frame: frame - 105, fps, config: { damping: 15 } });
  const pill3 = spring({ frame: frame - 115, fps, config: { damping: 15 } });

  // Gradient rotation
  const gradientAngle = interpolate(frame, [48, 450], [135, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Particles / sparkles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i * 30 * Math.PI) / 180,
    delay: 52 + i * 2,
    distance: 200 + (i % 3) * 80,
    size: 4 + (i % 3) * 2,
  }));

  // Bottom CTA
  const ctaOpacity = interpolate(frame, [130, 145], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Audio src={staticFile("voiceover/prologue4.mp3")} />
      {/* Dark background (problem phase) */}
      {!isRevealed && (
        <AbsoluteFill
          style={{
            background: "linear-gradient(180deg, #0f172a, #1e293b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              opacity: solutionTextOpacity,
              transform: `scale(${solutionTextScale})`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: "#fff",
                fontFamily: "Inter, system-ui, sans-serif",
                lineHeight: 1.3,
              }}
            >
              Et si on pouvait
            </div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: VALENTINE_COLORS.primary,
                fontFamily: "Inter, system-ui, sans-serif",
                lineHeight: 1.3,
              }}
            >
              changer ça ?
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Solution background (gradient Valentine) */}
      {isRevealed && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(${gradientAngle}deg, ${VALENTINE_COLORS.primary}, ${VALENTINE_COLORS.secondary}, ${VALENTINE_COLORS.accent})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Sparkle particles */}
          {particles.map((p, i) => {
            const particleProgress = spring({
              frame: frame - p.delay,
              fps,
              config: { damping: 20, stiffness: 40 },
            });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${Math.cos(p.angle) * p.distance * particleProgress}px)`,
                  top: `calc(50% + ${Math.sin(p.angle) * p.distance * particleProgress}px - 40px)`,
                  width: p.size,
                  height: p.size,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.6)",
                  opacity: interpolate(
                    particleProgress,
                    [0, 0.3, 1],
                    [0, 1, 0]
                  ),
                }}
              />
            );
          })}

          {/* Logo container */}
          <div
            style={{
              transform: `scale(${logoScale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: 28,
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                border: "2px solid rgba(255,255,255,0.3)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
              }}
            >
              <span style={{ fontSize: 56 }}>🎯</span>
            </div>

            {/* Name */}
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: "#fff",
                fontFamily: "Inter, system-ui, sans-serif",
                letterSpacing: -2,
                textShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}
            >
              SmartQueue
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              opacity: taglineOpacity,
              transform: `translateY(${taglineY}px)`,
              fontSize: 28,
              color: "rgba(255,255,255,0.9)",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              marginBottom: 40,
              textShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            La file d&apos;attente, enfin intelligente.
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { text: "✅ Équitable", opacity: pill1 },
              { text: "⚡ Rapide", opacity: pill2 },
              { text: "📊 Transparent", opacity: pill3 },
            ].map((pill) => (
              <div
                key={pill.text}
                style={{
                  opacity: pill.opacity,
                  transform: `translateY(${interpolate(pill.opacity, [0, 1], [20, 0])}px)`,
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  padding: "12px 28px",
                  borderRadius: 50,
                  fontSize: 20,
                  color: "#fff",
                  fontWeight: 600,
                  fontFamily: "Inter, system-ui, sans-serif",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                {pill.text}
              </div>
            ))}
          </div>

          {/* Bottom text */}
          <div
            style={{
              position: "absolute",
              bottom: 60,
              opacity: ctaOpacity,
              fontSize: 20,
              color: "rgba(255,255,255,0.7)",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
            }}
          >
            Voyons comment ça marche →
          </div>
        </AbsoluteFill>
      )}

      {/* Flash transition */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#fff",
          opacity: flashOpacity,
          pointerEvents: "none",
          zIndex: 100,
        }}
      />
    </AbsoluteFill>
  );
};
