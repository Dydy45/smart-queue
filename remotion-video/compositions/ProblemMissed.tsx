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
import { VectorPerson } from "../components/VectorPerson";
import { VALENTINE_COLORS } from "../theme";

export const ProblemMissed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Person waiting, checking watch (0-40)
  const watchCheck =
    frame > 15 && frame < 35
      ? Math.sin((frame - 15) * 0.3) * 8
      : 0;

  // Phase 2: Clock fast-forwarding (40-70)
  const clockSpeed = frame > 40 ? 8 : 1;
  const clockAngle = interpolate(
    frame,
    [0, 40, 70],
    [0, 40, 40 + 360 * 3],
    { extrapolateRight: "clamp" }
  );

  // Phase 3: Phone notification - missed appointment (70-90)
  const phoneNotif = spring({
    frame: frame - 72,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  // Phase 4: Person slumps / despair (90-120)
  const slumpRotation = interpolate(frame, [90, 110], [0, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slumpY = interpolate(frame, [90, 110], [0, 15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Text animations
  const text1Opacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const text2Opacity = interpolate(frame, [75, 88], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const text2Y = interpolate(frame, [75, 88], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Despair text
  const text3Opacity = interpolate(frame, [100, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Red flash when notification arrives
  const redFlash = interpolate(frame, [72, 76, 82], [0, 0.15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Queue people (still waiting too)
  const queuePeople = [
    { x: 300, color: "#3b82f6", skin: "#d4a574" },
    { x: 240, color: "#10b981", skin: "#fbbf24" },
    { x: 180, color: "#f59e0b", skin: "#c68642" },
    { x: 120, color: "#8b5cf6", skin: "#f1c27d" },
  ];

  // Sweat drops on main character
  const sweatDrop1 = interpolate(
    frame % 40,
    [0, 20, 40],
    [0, 15, 30]
  );
  const sweatOpacity = frame > 30 ? 0.7 : 0;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #e0e7ff, #c7d2fe)",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("voiceover/prologue3.mp3")} />
      {/* Floor */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: 200,
          background: "linear-gradient(180deg, #d6d3d1, #a8a29e)",
        }}
      />

      {/* Large clock on wall - center focus */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: "50%",
          transform: "translateX(-50%)",
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "#fff",
          border: "6px solid #1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 5,
        }}
      >
        {/* Hour markers */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
          (deg) => (
            <div
              key={deg}
              style={{
                position: "absolute",
                width: 3,
                height: 10,
                background: "#1e293b",
                transformOrigin: "center 60px",
                transform: `rotate(${deg}deg)`,
              }}
            />
          )
        )}
        {/* Minute hand */}
        <div
          style={{
            position: "absolute",
            width: 4,
            height: 50,
            background: "#1e293b",
            borderRadius: 2,
            transformOrigin: "bottom center",
            transform: `rotate(${clockAngle}deg)`,
            bottom: "50%",
          }}
        />
        {/* Hour hand */}
        <div
          style={{
            position: "absolute",
            width: 5,
            height: 35,
            background: "#475569",
            borderRadius: 3,
            transformOrigin: "bottom center",
            transform: `rotate(${clockAngle / 12}deg)`,
            bottom: "50%",
          }}
        />
        {/* Second hand */}
        <div
          style={{
            position: "absolute",
            width: 2,
            height: 55,
            background: VALENTINE_COLORS.primary,
            borderRadius: 1,
            transformOrigin: "bottom center",
            transform: `rotate(${clockAngle * clockSpeed}deg)`,
            bottom: "50%",
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#1e293b",
            zIndex: 3,
          }}
        />
      </div>

      {/* Queue of people - still there */}
      {queuePeople.map((person, i) => (
        <div key={i} style={{ position: "absolute", bottom: 200 }}>
          <VectorPerson
            x={person.x}
            y={0}
            scale={0.6}
            color={person.color}
            skinColor={person.skin}
            expression="tired"
          />
        </div>
      ))}

      {/* Main character - waiting, then slumping */}
      <div
        style={{
          position: "absolute",
          bottom: 200 - slumpY,
        }}
      >
        <VectorPerson
          x={420}
          y={0}
          scale={0.75}
          color={VALENTINE_COLORS.primary}
          skinColor="#fbbf24"
          expression={frame < 70 ? "tired" : "shocked"}
          accessory="watch"
          rotation={frame > 90 ? slumpRotation : watchCheck}
        />

        {/* Sweat drops */}
        {frame > 30 && (
          <>
            <div
              style={{
                position: "absolute",
                left: 448,
                bottom: 100 + sweatDrop1,
                opacity: sweatOpacity,
                fontSize: 14,
                color: "#3b82f6",
              }}
            >
              💧
            </div>
          </>
        )}
      </div>

      {/* Phone notification popup */}
      {frame > 70 && (
        <div
          style={{
            position: "absolute",
            left: 480,
            bottom: 370,
            transform: `scale(${phoneNotif})`,
            transformOrigin: "bottom left",
          }}
        >
          {/* Phone */}
          <div
            style={{
              width: 180,
              background: "#fff",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              border: "2px solid #fecaca",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#fecaca",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                }}
              >
                🔴
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  color: "#dc2626",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                RDV MANQUÉ
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                fontFamily: "Inter, system-ui, sans-serif",
                lineHeight: 1.4,
              }}
            >
              Votre rendez-vous de 14h00 est passé. Vous devrez reprendre un
              nouveau rendez-vous.
            </div>
          </div>
          {/* Bubble tail */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "14px solid #fff",
              marginLeft: 20,
            }}
          />
        </div>
      )}

      {/* Text: Waiting */}
      <div
        style={{
          position: "absolute",
          top: 210,
          left: 60,
          opacity: text1Opacity,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: "#64748b",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          ⏳ Le temps passe...
        </div>
      </div>

      {/* Text: Missed appointment */}
      <div
        style={{
          position: "absolute",
          top: 45,
          left: 60,
          opacity: text2Opacity,
          transform: `translateY(${text2Y}px)`,
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: "#1e293b",
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.2,
          }}
        >
          Rendez-vous
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: "#dc2626",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          manqué.
        </div>
      </div>

      {/* Despair sub-text */}
      <div
        style={{
          position: "absolute",
          top: 145,
          left: 60,
          opacity: text3Opacity,
          fontSize: 22,
          color: "#64748b",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 500,
          lineHeight: 1.5,
        }}
      >
        Du temps perdu. De la frustration.
        <br />
        Et ça recommence chaque fois...
      </div>

      {/* Red flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#dc2626",
          opacity: redFlash,
          pointerEvents: "none",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.12) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
