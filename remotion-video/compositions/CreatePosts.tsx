import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile } from "remotion";
import { FadeTransition } from "../components/FadeTransition";
import { SceneTitle } from "../components/SceneTitle";
import { MockBrowser } from "../components/MockBrowser";
import { MockNavbar } from "../components/MockNavbar";
import { VALENTINE_COLORS } from "../theme";

export const CreatePosts: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ownerLinks = ["Accueil", "Vos services", "Vos postes", "Gestion Staff", "Tableau de bord"];

  const card1 = spring({ frame: frame - 70, fps, config: { damping: 15 } });
  const card2 = spring({ frame: frame - 130, fps, config: { damping: 15 } });
  const card3 = spring({ frame: frame - 190, fps, config: { damping: 15 } });

  // Dropdown animation
  const dropdownOpen = frame > 20 && frame < 65;

  // Post name typing
  const postNames = ["Cabinet A", "Cabinet B", "Salle Radio 1"];
  let currentPostName = "";
  if (frame < 70) {
    const chars = Math.floor(interpolate(frame, [40, 60], [0, 9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    currentPostName = postNames[0].slice(0, chars);
  } else if (frame < 130) {
    const chars = Math.floor(interpolate(frame, [100, 120], [0, 9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    currentPostName = postNames[1].slice(0, chars);
  } else {
    const chars = Math.floor(interpolate(frame, [160, 185], [0, 14], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    currentPostName = postNames[2].slice(0, chars);
  }

  const currentService = frame < 130 ? "Consultation générale" : "Radiologie";

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
        <Audio src={staticFile("voiceover/scene4.mp3")} />
        <SceneTitle step="Étape 3" title="Créez vos postes de travail" delay={5} />

        <MockBrowser url="smartqueue.com/poste_list">
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <MockNavbar links={ownerLinks} activeLink="Vos postes" delay={10} />

            <div style={{ flex: 1, padding: 40, background: "#f8fafc" }}>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", marginBottom: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
                Vos postes
              </div>

              {/* Create form */}
              <div style={{ display: "flex", gap: 12, marginBottom: 32, alignItems: "flex-end" }}>
                {/* Service dropdown */}
                <div style={{ width: 220, position: "relative" }}>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif" }}>
                    Service
                  </div>
                  <div
                    style={{
                      height: 40,
                      border: `2px solid ${VALENTINE_COLORS.primary}`,
                      borderRadius: 8,
                      padding: "0 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 14,
                      color: "#1e293b",
                      fontFamily: "Inter, system-ui, sans-serif",
                      background: "#fff",
                    }}
                  >
                    {currentService}
                    <span style={{ fontSize: 12 }}>▼</span>
                  </div>
                  {dropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: 68,
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "2px solid #e2e8f0",
                        borderRadius: 8,
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        zIndex: 10,
                      }}
                    >
                      <div style={{ padding: "10px 12px", background: "#ede9fe", fontSize: 14, fontFamily: "Inter, system-ui, sans-serif", color: "#4f46e5", fontWeight: 600 }}>
                        Consultation générale
                      </div>
                      <div style={{ padding: "10px 12px", fontSize: 14, fontFamily: "Inter, system-ui, sans-serif", color: "#475569" }}>
                        Radiologie
                      </div>
                    </div>
                  )}
                </div>

                {/* Post name */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif" }}>
                    Nom du poste
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
                    {currentPostName}
                    <span style={{ opacity: frame % 30 > 15 ? 1 : 0, color: VALENTINE_COLORS.primary }}>|</span>
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
                  Créer le poste
                </div>
              </div>

              {/* Post cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { name: "Cabinet A", service: "Consultation générale", opacity: card1, emoji: "🏥" },
                  { name: "Cabinet B", service: "Consultation générale", opacity: card2, emoji: "🏥" },
                  { name: "Salle Radio 1", service: "Radiologie", opacity: card3, emoji: "📡" },
                ].map((post) => (
                  <div
                    key={post.name}
                    style={{
                      opacity: post.opacity,
                      transform: `translateX(${interpolate(post.opacity, [0, 1], [-30, 0])}px)`,
                      background: "#fff",
                      borderRadius: 12,
                      padding: "14px 20px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>
                        {post.emoji} {post.name}
                      </div>
                      <div style={{ fontSize: 13, color: VALENTINE_COLORS.primary, fontFamily: "Inter, system-ui, sans-serif" }}>
                        Service : {post.service}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MockBrowser>
      </AbsoluteFill>
    </FadeTransition>
  );
};
