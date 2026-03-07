import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile } from "remotion";
import { SceneTitle } from "../components/SceneTitle";
import { MockBrowser } from "../components/MockBrowser";
import { VALENTINE_COLORS } from "../theme";

export const Signup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Browser appear
  const browserScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15, stiffness: 60 },
  });

  // Form fields animation
  const field1 = spring({ frame: frame - 40, fps, config: { damping: 15 } });
  const field2 = spring({ frame: frame - 55, fps, config: { damping: 15 } });
  const buttonProgress = spring({ frame: frame - 70, fps, config: { damping: 15 } });

  // Typing animation
  const emailChars = Math.floor(interpolate(frame, [90, 140], [0, 22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));
  const emailText = "owner@example.com".slice(0, emailChars);

  // Success checkmark
  const checkOpacity = interpolate(frame, [160, 175], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Audio src={staticFile("voiceover/scene2.mp3")} />
      <SceneTitle step="Étape 1" title="Créez votre compte" delay={5} />

      <div style={{ transform: `scale(${interpolate(browserScale, [0, 1], [0.9, 1])})`, opacity: browserScale }}>
        <MockBrowser url="smartqueue.com/sign-up">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              background: "#f8fafc",
              padding: 40,
            }}
          >
            {/* Logo */}
            <div style={{ fontSize: 36, fontWeight: "bold", color: "#1e293b", marginBottom: 8, fontFamily: "Inter, system-ui, sans-serif" }}>
              🎯 SmartQueue
            </div>
            <div style={{ fontSize: 18, color: "#64748b", marginBottom: 40, fontFamily: "Inter, system-ui, sans-serif" }}>
              Créez votre compte gratuitement
            </div>

            {/* Form */}
              <div style={{ width: 400, display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Email field */}
                <div style={{ opacity: field1, transform: `translateY(${interpolate(field1, [0, 1], [20, 0])}px)` }}>
                  <div style={{ fontSize: 14, color: "#475569", marginBottom: 6, fontFamily: "Inter, system-ui, sans-serif" }}>Email</div>
                  <div
                    style={{
                      height: 44,
                      border: `2px solid ${VALENTINE_COLORS.primary}`,
                      borderRadius: 8,
                      padding: "0 12px",
                      display: "flex",
                      alignItems: "center",
                      fontSize: 16,
                      color: "#1e293b",
                      fontFamily: "monospace",
                      background: "#fff",
                    }}
                  >
                    {emailText}
                    <span style={{ opacity: frame % 30 > 15 ? 1 : 0, color: VALENTINE_COLORS.primary }}>|</span>
                  </div>
                </div>

                {/* Password field */}
                <div style={{ opacity: field2, transform: `translateY(${interpolate(field2, [0, 1], [20, 0])}px)` }}>
                  <div style={{ fontSize: 14, color: "#475569", marginBottom: 6, fontFamily: "Inter, system-ui, sans-serif" }}>Mot de passe</div>
                  <div
                    style={{
                      height: 44,
                      border: "2px solid #e2e8f0",
                      borderRadius: 8,
                      padding: "0 12px",
                      display: "flex",
                      alignItems: "center",
                      fontSize: 16,
                      color: "#1e293b",
                      background: "#fff",
                    }}
                  >
                    ••••••••
                  </div>
                </div>

                {/* Button */}
                <div style={{ opacity: buttonProgress, transform: `translateY(${interpolate(buttonProgress, [0, 1], [20, 0])}px)` }}>
                  <div
                    style={{
                      height: 48,
                      background: VALENTINE_COLORS.primary,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: "bold",
                      fontFamily: "Inter, system-ui, sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    Créer mon compte
                  </div>
                </div>

                {/* Success */}
                <div
                  style={{
                    opacity: checkOpacity,
                    textAlign: "center",
                    fontSize: 16,
                    color: "#22c55e",
                    fontWeight: 600,
                    fontFamily: "Inter, system-ui, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 24 }}>✓</span> Compte créé avec succès !
                </div>
            </div>
          </div>
        </MockBrowser>
      </div>
    </AbsoluteFill>
  );
};
