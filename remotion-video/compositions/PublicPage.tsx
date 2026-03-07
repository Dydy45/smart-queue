import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile } from "remotion";
import { FadeTransition } from "../components/FadeTransition";
import { SceneTitle } from "../components/SceneTitle";
import { MockBrowser } from "../components/MockBrowser";
import { VALENTINE_COLORS } from "../theme";

export const PublicPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Settings modal
  const modalAppear = spring({ frame: frame - 15, fps, config: { damping: 15 } });

  // Typing page name
  const pageNameChars = Math.floor(interpolate(frame, [40, 75], [0, 16], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const pageName = "cabinet-medical".slice(0, pageNameChars);

  // Success
  const successOpacity = interpolate(frame, [90, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Link highlight
  const linkPulse = interpolate(frame, [110, 120, 130], [1, 1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <FadeTransition>
      <AbsoluteFill
        style={{
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Audio src={staticFile("voiceover/scene6.mp3")} />
        <SceneTitle step="Étape 5" title="Configurez votre page publique" delay={5} />

        <MockBrowser url="smartqueue.com">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            {/* Modal */}
            <div
              style={{
                opacity: modalAppear,
                transform: `scale(${interpolate(modalAppear, [0, 1], [0.9, 1])})`,
                width: 500,
                background: "#fff",
                borderRadius: 16,
                padding: 40,
                boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", marginBottom: 8, fontFamily: "Inter, system-ui, sans-serif" }}>
                ⚙️ Paramètres
              </div>
              <div style={{ fontSize: 15, color: "#64748b", marginBottom: 28, fontFamily: "Inter, system-ui, sans-serif" }}>
                Configurez votre page publique
              </div>

              {/* Page name input */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, color: "#475569", marginBottom: 6, fontFamily: "Inter, system-ui, sans-serif" }}>
                  Nom de votre page
                </div>
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
                  {pageName}
                  <span style={{ opacity: frame % 30 > 15 && frame < 80 ? 1 : 0, color: VALENTINE_COLORS.primary }}>|</span>
                </div>
              </div>

              {/* URL preview */}
              <div
                style={{
                  transform: `scale(${linkPulse})`,
                  padding: "12px 16px",
                  background: "#f0fdf4",
                  borderRadius: 8,
                  border: "1px solid #bbf7d0",
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif" }}>
                  Votre page publique sera accessible sur :
                </div>
                <div style={{ fontSize: 16, color: "#16a34a", fontWeight: 600, fontFamily: "monospace" }}>
                  smartqueue.com/page/{pageName}
                </div>
              </div>

              {/* Button */}
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
                }}
              >
                Enregistrer
              </div>

              {/* Success */}
              <div
                style={{
                  opacity: successOpacity,
                  textAlign: "center",
                  marginTop: 16,
                  fontSize: 15,
                  color: "#22c55e",
                  fontWeight: 600,
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                ✓ Page publique configurée !
              </div>
            </div>
          </div>
        </MockBrowser>
      </AbsoluteFill>
    </FadeTransition>
  );
};
