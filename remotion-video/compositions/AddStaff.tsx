import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile } from "remotion";
import { FadeTransition } from "../components/FadeTransition";
import { SceneTitle } from "../components/SceneTitle";
import { MockBrowser } from "../components/MockBrowser";
import { MockNavbar } from "../components/MockNavbar";
import { VALENTINE_COLORS } from "../theme";

export const AddStaff: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ownerLinks = ["Accueil", "Vos services", "Vos postes", "Gestion Staff", "Tableau de bord"];

  // Phase 1: Add staff form (0-80)
  const emailChars = Math.floor(interpolate(frame, [30, 60], [0, 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const emailText = "dr.martin@email.com".slice(0, emailChars);

  const nameChars = Math.floor(interpolate(frame, [65, 80], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const nameText = "Dr. Martin".slice(0, nameChars);

  // Phase 2: Staff card appears (80-100)
  const staffCard = spring({ frame: frame - 95, fps, config: { damping: 15 } });

  // Phase 3: Post assignment (100-140)
  const assignSection = spring({ frame: frame - 110, fps, config: { damping: 15 } });
  const badgeAppear = spring({ frame: frame - 135, fps, config: { damping: 12, stiffness: 100 } });

  // Phase 4: Second staff (optional visual)
  const staff2Card = spring({ frame: frame - 160, fps, config: { damping: 15 } });
  const badge2Appear = spring({ frame: frame - 185, fps, config: { damping: 12, stiffness: 100 } });

  // Success indicator
  const successOpacity = interpolate(frame, [200, 215], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
        <Audio src={staticFile("voiceover/scene5.mp3")} />
        <SceneTitle step="Étape 4" title="Ajoutez vos employés et assignez-les" delay={5} />

        <MockBrowser url="smartqueue.com/staff">
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <MockNavbar links={ownerLinks} activeLink="Gestion Staff" delay={10} />

            <div style={{ flex: 1, padding: 32, background: "#f8fafc", overflow: "hidden" }}>
              <div style={{ fontSize: 22, fontWeight: "bold", color: "#1e293b", marginBottom: 20, fontFamily: "Inter, system-ui, sans-serif" }}>
                Gestion du personnel
              </div>

              {/* Add form */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif" }}>Email</div>
                  <div style={{ height: 36, border: `2px solid ${VALENTINE_COLORS.primary}`, borderRadius: 8, padding: "0 10px", display: "flex", alignItems: "center", fontSize: 14, color: "#1e293b", fontFamily: "monospace", background: "#fff" }}>
                    {emailText}
                    <span style={{ opacity: frame % 30 > 15 && frame < 85 ? 1 : 0, color: VALENTINE_COLORS.primary }}>|</span>
                  </div>
                </div>
                <div style={{ width: 150 }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif" }}>Nom</div>
                  <div style={{ height: 36, border: "2px solid #e2e8f0", borderRadius: 8, padding: "0 10px", display: "flex", alignItems: "center", fontSize: 14, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif", background: "#fff" }}>
                    {nameText}
                  </div>
                </div>
                <div style={{ width: 120 }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif" }}>Rôle</div>
                  <div style={{ height: 36, border: "2px solid #e2e8f0", borderRadius: 8, padding: "0 10px", display: "flex", alignItems: "center", fontSize: 14, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif", background: "#fff" }}>
                    STAFF
                  </div>
                </div>
                <div style={{ height: 36, padding: "0 16px", background: VALENTINE_COLORS.primary, color: "#fff", borderRadius: 8, display: "flex", alignItems: "center", fontSize: 13, fontWeight: "bold", fontFamily: "Inter, system-ui, sans-serif" }}>
                  Ajouter
                </div>
              </div>

              {/* Staff cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Staff 1 - Dr. Martin */}
                <div
                  style={{
                    opacity: staffCard,
                    transform: `translateY(${interpolate(staffCard, [0, 1], [20, 0])}px)`,
                    background: "#fff",
                    borderRadius: 12,
                    padding: "16px 20px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: assignSection > 0.5 ? 12 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        👨‍⚕️
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>Dr. Martin</div>
                        <div style={{ fontSize: 13, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>dr.martin@email.com</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, padding: "4px 10px", background: "#dbeafe", color: "#1d4ed8", borderRadius: 6, fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
                        STAFF
                      </span>
                    </div>
                  </div>

                  {/* Post assignment section */}
                  {assignSection > 0.3 && (
                    <div style={{ opacity: assignSection, borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 13, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>Postes :</div>
                      {badgeAppear > 0.2 && (
                        <div
                          style={{
                            opacity: badgeAppear,
                            transform: `scale(${interpolate(badgeAppear, [0, 1], [0.5, 1])})`,
                            padding: "4px 12px",
                            background: VALENTINE_COLORS.primary,
                            color: "#fff",
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: "Inter, system-ui, sans-serif",
                          }}
                        >
                          🏥 Cabinet A
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Staff 2 - Technicien */}
                <div
                  style={{
                    opacity: staff2Card,
                    transform: `translateY(${interpolate(staff2Card, [0, 1], [20, 0])}px)`,
                    background: "#fff",
                    borderRadius: 12,
                    padding: "16px 20px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: badge2Appear > 0.5 ? 12 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        🔬
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>Tech. Radio</div>
                        <div style={{ fontSize: 13, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>tech.radio@email.com</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, padding: "4px 10px", background: "#dbeafe", color: "#1d4ed8", borderRadius: 6, fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
                      STAFF
                    </span>
                  </div>
                  {badge2Appear > 0.3 && (
                    <div style={{ opacity: badge2Appear, borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 13, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>Postes :</div>
                      <div style={{ opacity: badge2Appear, transform: `scale(${interpolate(badge2Appear, [0, 1], [0.5, 1])})`, padding: "4px 12px", background: "#6366f1", color: "#fff", borderRadius: 20, fontSize: 13, fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
                        📡 Salle Radio 1
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Success message */}
              <div style={{ opacity: successOpacity, textAlign: "center", marginTop: 20, fontSize: 16, color: "#22c55e", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
                ✓ Configuration du personnel terminée !
              </div>
            </div>
          </div>
        </MockBrowser>
      </AbsoluteFill>
    </FadeTransition>
  );
};
