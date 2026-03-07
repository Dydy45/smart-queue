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
import { VALENTINE_COLORS } from "../theme";

export const ClientFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Service selection highlight
  const serviceSelect = spring({ frame: frame - 30, fps, config: { damping: 15 } });

  // Name typing
  const nameChars = Math.floor(interpolate(frame, [60, 80], [0, 11], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const clientName = "Jean Dupont".slice(0, nameChars);

  // Button click
  const buttonClick = frame > 95;

  // Ticket result
  const ticketAppear = spring({ frame: frame - 100, fps, config: { damping: 12, stiffness: 80 } });

  // Second ticket
  const ticket2Appear = spring({ frame: frame - 160, fps, config: { damping: 12, stiffness: 80 } });

  return (
    <FadeTransition>
      <AbsoluteFill
        style={{
          background: "#f8fafc",
        }}
      >
        <Audio src={staticFile("voiceover/scene7.mp3")} />
        <SceneTitle step="Côté Client" title="Créer un ticket" delay={5} />

        <MockBrowser url="smartqueue.com/page/cabinet-medical">
          <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
            {/* Simple header */}
            <div style={{ height: 56, background: VALENTINE_COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 22, fontWeight: "bold", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
                🎯 Cabinet Médical
              </span>
            </div>

            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 500 }}>
                <div style={{ fontSize: 28, fontWeight: "bold", color: "#1e293b", textAlign: "center", marginBottom: 32, fontFamily: "Inter, system-ui, sans-serif" }}>
                  Prendre un ticket
                </div>

                {/* Service selection */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, color: "#475569", marginBottom: 6, fontFamily: "Inter, system-ui, sans-serif" }}>
                    Choisissez votre service
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div
                      style={{
                        flex: 1,
                        padding: "16px",
                        borderRadius: 12,
                        border: serviceSelect > 0.5 ? `2px solid ${VALENTINE_COLORS.primary}` : "2px solid #e2e8f0",
                        background: serviceSelect > 0.5 ? "#ede9fe" : "#fff",
                        textAlign: "center",
                        transition: "all 0.3s",
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 4 }}>🩺</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>
                        Consultation générale
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>
                        ~15 min
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: "16px",
                        borderRadius: 12,
                        border: "2px solid #e2e8f0",
                        background: "#fff",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 4 }}>📡</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>
                        Radiologie
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>
                        ~30 min
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name input */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, color: "#475569", marginBottom: 6, fontFamily: "Inter, system-ui, sans-serif" }}>
                    Votre nom
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
                      fontFamily: "Inter, system-ui, sans-serif",
                      background: "#fff",
                    }}
                  >
                    {clientName}
                    <span style={{ opacity: frame % 30 > 15 && frame < 95 ? 1 : 0, color: VALENTINE_COLORS.primary }}>|</span>
                  </div>
                </div>

                {/* Button */}
                <div
                  style={{
                    height: 48,
                    background: buttonClick ? VALENTINE_COLORS.primaryFocus : VALENTINE_COLORS.primary,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "bold",
                    fontFamily: "Inter, system-ui, sans-serif",
                    transform: buttonClick ? "scale(0.98)" : "scale(1)",
                    marginBottom: 24,
                  }}
                >
                  Créer le ticket
                </div>

                {/* Ticket result */}
                {ticketAppear > 0.1 && (
                  <div
                    style={{
                      opacity: ticketAppear,
                      transform: `scale(${interpolate(ticketAppear, [0, 1], [0.8, 1])})`,
                      background: "#f0fdf4",
                      border: "2px solid #22c55e",
                      borderRadius: 16,
                      padding: "20px 24px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 14, color: "#16a34a", fontFamily: "Inter, system-ui, sans-serif", marginBottom: 8 }}>
                      ✓ Ticket créé avec succès !
                    </div>
                    <div style={{ fontSize: 36, fontWeight: "bold", color: "#1e293b", fontFamily: "monospace", letterSpacing: 2 }}>
                      T20260305A4K9
                    </div>
                    <div style={{ fontSize: 14, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif", marginTop: 8 }}>
                      Jean Dupont - Consultation générale
                    </div>
                    <div style={{ fontSize: 13, color: VALENTINE_COLORS.primary, fontFamily: "Inter, system-ui, sans-serif", marginTop: 4 }}>
                      Temps d&apos;attente estimé : ~15 min
                    </div>
                  </div>
                )}

                {/* Second ticket (small) */}
                {ticket2Appear > 0.1 && (
                  <div
                    style={{
                      opacity: ticket2Appear,
                      transform: `translateY(${interpolate(ticket2Appear, [0, 1], [20, 0])}px)`,
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: "12px 16px",
                      marginTop: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif" }}>
                        Marie Martin
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", fontFamily: "Inter, system-ui, sans-serif" }}>Consultation générale</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: "bold", color: "#6366f1", fontFamily: "monospace" }}>
                      T20260305B7M2
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </MockBrowser>
      </AbsoluteFill>
    </FadeTransition>
  );
};
