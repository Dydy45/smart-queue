import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile } from "remotion";
import { FadeTransition } from "../components/FadeTransition";
import { SceneTitle } from "../components/SceneTitle";
import { MockBrowser } from "../components/MockBrowser";
import { MockNavbar } from "../components/MockNavbar";
import { VALENTINE_COLORS } from "../theme";

export const CreateServices: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ownerLinks = ["Accueil", "Vos services", "Vos postes", "Gestion Staff", "Tableau de bord"];

  // Service cards appearing
  const card1 = spring({ frame: frame - 60, fps, config: { damping: 15 } });
  const card2 = spring({ frame: frame - 120, fps, config: { damping: 15 } });

  // Input typing
  const serviceName1Chars = Math.floor(interpolate(frame, [30, 55], [0, 23], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const serviceName1 = "Consultation générale".slice(0, serviceName1Chars);

  const serviceName2Chars = Math.floor(interpolate(frame, [90, 105], [0, 11], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const serviceName2 = "Radiologie".slice(0, serviceName2Chars);

  return (
    <FadeTransition>
      <AbsoluteFill
        style={{
          background: "#f8fafc",
        }}
      >
        <Audio src={staticFile("voiceover/scene3.mp3")} />
        <SceneTitle step="Étape 2" title="Créez vos services" delay={5} />

        <MockBrowser url="smartqueue.com/services">
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <MockNavbar links={ownerLinks} activeLink="Vos services" delay={10} />

            <div style={{ flex: 1, padding: 40, background: "#f8fafc" }}>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", marginBottom: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
                Vos services
              </div>

              {/* Create form */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 32,
                  alignItems: "flex-end",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif" }}>
                    Nom du service
                  </div>
                  <div
                    style={{
                      height: 40,
                      border: `2px solid ${VALENTINE_COLORS.primary}`,
                      borderRadius: 8,
                      padding: "0 12px",
                      display: "flex",
                      alignItems: "center",
                      fontSize: 15,
                      color: "#1e293b",
                      fontFamily: "Inter, system-ui, sans-serif",
                      background: "#fff",
                    }}
                  >
                    {frame < 60 ? serviceName1 : serviceName2}
                    <span style={{ opacity: frame % 30 > 15 ? 1 : 0, color: VALENTINE_COLORS.primary }}>|</span>
                  </div>
                </div>
                <div style={{ width: 120 }}>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif" }}>
                    Temps moyen
                  </div>
                  <div
                    style={{
                      height: 40,
                      border: "2px solid #e2e8f0",
                      borderRadius: 8,
                      padding: "0 12px",
                      display: "flex",
                      alignItems: "center",
                      fontSize: 15,
                      color: "#1e293b",
                      fontFamily: "Inter, system-ui, sans-serif",
                      background: "#fff",
                    }}
                  >
                    {frame < 60 ? "15 min" : "30 min"}
                  </div>
                </div>
                <div
                  style={{
                    height: 40,
                    padding: "0 20px",
                    background: VALENTINE_COLORS.primary,
                    color: "#fff",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 14,
                    fontWeight: "bold",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  Créer
                </div>
              </div>

              {/* Service cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    opacity: card1,
                    transform: `translateX(${interpolate(card1, [0, 1], [-40, 0])}px)`,
                    background: "#fff",
                    borderRadius: 12,
                    padding: "16px 24px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>
                      Consultation générale
                    </div>
                    <div style={{ fontSize: 14, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>
                      Temps moyen : 15 minutes
                    </div>
                  </div>
                  <div style={{ fontSize: 28 }}>🩺</div>
                </div>

                <div
                  style={{
                    opacity: card2,
                    transform: `translateX(${interpolate(card2, [0, 1], [-40, 0])}px)`,
                    background: "#fff",
                    borderRadius: 12,
                    padding: "16px 24px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>
                      Radiologie
                    </div>
                    <div style={{ fontSize: 14, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>
                      Temps moyen : 30 minutes
                    </div>
                  </div>
                  <div style={{ fontSize: 28 }}>📡</div>
                </div>
              </div>
            </div>
          </div>
        </MockBrowser>
      </AbsoluteFill>
    </FadeTransition>
  );
};
