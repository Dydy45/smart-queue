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
import { FadeTransition } from "../components/FadeTransition";
import { SceneTitle } from "../components/SceneTitle";
import { MockBrowser } from "../components/MockBrowser";
import { MockNavbar } from "../components/MockNavbar";
import { VALENTINE_COLORS } from "../theme";

export const StaffFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const staffLinks = ["Accueil"];

  // Phase 1: Staff homepage with assigned posts (0-60)
  const postCard = spring({ frame: frame - 15, fps, config: { damping: 15 } });

  // Phase 2: Click on post -> treatment page (60+)
  const isOnTreatmentPage = frame > 60;

  // Phase 3: Call next ticket (80+)
  const callButton = spring({ frame: frame - 85, fps, config: { damping: 15 } });
  const ticketAppear = spring({ frame: frame - 100, fps, config: { damping: 12, stiffness: 80 } });

  // Phase 4: Start treatment (140+)
  const statusProgress = frame > 140;

  // Phase 5: Finish (180+)
  const statusFinished = frame > 180;

  // Success
  const doneOpacity = interpolate(frame, [185, 200], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Next ticket ready
  const nextTicket = spring({ frame: frame - 210, fps, config: { damping: 15 } });

  // Ticket status
  let ticketStatus = "PENDING";
  let statusColor = "#eab308";
  let statusBg = "#fef9c3";
  if (frame > 100 && frame <= 140) {
    ticketStatus = "CALL";
    statusColor = "#3b82f6";
    statusBg = "#dbeafe";
  } else if (frame > 140 && frame <= 180) {
    ticketStatus = "EN COURS";
    statusColor = "#f97316";
    statusBg = "#ffedd5";
  } else if (frame > 180) {
    ticketStatus = "TERMINÉ";
    statusColor = "#22c55e";
    statusBg = "#dcfce7";
  }

  return (
    <FadeTransition>
      <AbsoluteFill style={{ background: "#f8fafc" }}>
        <Audio src={staticFile("voiceover/scene8.mp3")} />
        <SceneTitle step="Côté Employé" title="Traiter les tickets" delay={5} />

        <MockBrowser url={isOnTreatmentPage ? "smartqueue.com/call/cabinet-a" : "smartqueue.com"}>
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <MockNavbar links={staffLinks} activeLink="Accueil" delay={10} />

            <div style={{ flex: 1, padding: 40, background: "#f8fafc" }}>
              {!isOnTreatmentPage ? (
                /* Staff homepage - assigned posts */
                <div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", marginBottom: 8, fontFamily: "Inter, system-ui, sans-serif" }}>
                    Mes postes assignés
                  </div>
                  <div style={{ fontSize: 15, color: "#64748b", marginBottom: 28, fontFamily: "Inter, system-ui, sans-serif" }}>
                    Cliquez sur un poste pour commencer à traiter les tickets
                  </div>

                  <div
                    style={{
                      opacity: postCard,
                      transform: `translateY(${interpolate(postCard, [0, 1], [20, 0])}px)`,
                      width: 300,
                      background: "#fff",
                      borderRadius: 16,
                      padding: "28px 24px",
                      border: "2px solid #e2e8f0",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
                    <div style={{ fontSize: 20, fontWeight: "bold", color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>
                      Cabinet A
                    </div>
                    <div style={{ fontSize: 14, color: "#6366f1", fontFamily: "Inter, system-ui, sans-serif", marginTop: 4 }}>
                      Consultation générale
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif", marginTop: 8 }}>
                      2 tickets en attente
                    </div>
                  </div>
                </div>
              ) : (
                /* Treatment page */
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>
                        🏥 Cabinet A
                      </div>
                      <div style={{ fontSize: 14, color: VALENTINE_COLORS.primary, fontFamily: "Inter, system-ui, sans-serif" }}>
                        Consultation générale
                      </div>
                    </div>
                    <div style={{ padding: "6px 16px", background: statusBg, color: statusColor, borderRadius: 8, fontSize: 14, fontWeight: "bold", fontFamily: "Inter, system-ui, sans-serif" }}>
                      {ticketStatus}
                    </div>
                  </div>

                  {/* Current ticket */}
                  {ticketAppear > 0.1 && (
                    <div
                      style={{
                        opacity: ticketAppear,
                        transform: `scale(${interpolate(ticketAppear, [0, 1], [0.9, 1])})`,
                        background: "#fff",
                        borderRadius: 16,
                        padding: "28px 32px",
                        border: `2px solid ${frame > 100 ? statusColor : VALENTINE_COLORS.primary}`,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        marginBottom: 20,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 14, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>Ticket en cours</div>
                          <div style={{ fontSize: 28, fontWeight: "bold", color: "#1e293b", fontFamily: "monospace", letterSpacing: 2 }}>
                            T20260305A4K9
                          </div>
                        </div>
                        <div style={{ fontSize: 48 }}>👤</div>
                      </div>
                      <div style={{ display: "flex", gap: 24 }}>
                        <div>
                          <div style={{ fontSize: 12, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>Client</div>
                          <div style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>Jean Dupont</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>Service</div>
                          <div style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>Consultation</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 12 }}>
                    {!statusFinished && frame < 100 && (
                      <div
                        style={{
                          opacity: callButton,
                          flex: 1,
                          height: 48,
                          background: "#3b82f6",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 15,
                          fontWeight: "bold",
                          fontFamily: "Inter, system-ui, sans-serif",
                        }}
                      >
                        📢 Appeler le prochain ticket
                      </div>
                    )}
                    {frame >= 100 && !statusProgress && (
                      <div
                        style={{
                          flex: 1,
                          height: 48,
                          background: "#f97316",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 15,
                          fontWeight: "bold",
                          fontFamily: "Inter, system-ui, sans-serif",
                        }}
                      >
                        ▶ Commencer le traitement
                      </div>
                    )}
                    {statusProgress && !statusFinished && (
                      <div
                        style={{
                          flex: 1,
                          height: 48,
                          background: "#22c55e",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 15,
                          fontWeight: "bold",
                          fontFamily: "Inter, system-ui, sans-serif",
                        }}
                      >
                        ✓ Terminer
                      </div>
                    )}
                    {statusFinished && (
                      <div
                        style={{
                          opacity: doneOpacity,
                          flex: 1,
                          textAlign: "center",
                          fontSize: 18,
                          color: "#22c55e",
                          fontWeight: "bold",
                          fontFamily: "Inter, system-ui, sans-serif",
                          padding: 12,
                        }}
                      >
                        ✓ Ticket traité avec succès !
                      </div>
                    )}
                  </div>

                  {/* Next ticket preview */}
                  {nextTicket > 0.1 && (
                    <div
                      style={{
                        opacity: nextTicket,
                        transform: `translateY(${interpolate(nextTicket, [0, 1], [20, 0])}px)`,
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: 12,
                        padding: "14px 20px",
                        marginTop: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: 14, color: "#92400e", fontFamily: "Inter, system-ui, sans-serif" }}>
                        ⏳ Prochain ticket : <strong>Marie Martin</strong> - T20260305B7M2
                      </div>
                      <div style={{ padding: "4px 12px", background: "#fef3c7", borderRadius: 6, fontSize: 12, fontWeight: "bold", color: "#92400e", fontFamily: "Inter, system-ui, sans-serif" }}>
                        PENDING
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </MockBrowser>
      </AbsoluteFill>
    </FadeTransition>
  );
};
