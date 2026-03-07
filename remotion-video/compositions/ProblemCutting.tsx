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

export const ProblemCutting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Orderly queue (0-30)
  // Phase 2: Someone walks up to vigile (30-60)
  const cheaterX = interpolate(frame, [20, 50], [900, 520], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 3: Money exchange (60-90)
  const moneyOpacity = interpolate(frame, [55, 65, 80, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const moneyY = interpolate(frame, [55, 65], [0, -10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 4: Cheater moves to front (90-120)
  const cheaterCutX = interpolate(frame, [90, 115], [520, 660], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 5: Others react angrily (100+)
  const angerBubbles = spring({
    frame: frame - 105,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Vigile nod
  const vigileNod =
    frame > 70 && frame < 90
      ? Math.sin((frame - 70) * 0.5) * 5
      : 0;

  // Text overlay
  const textOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [30, 45], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Angry text
  const angryTextOpacity = interpolate(frame, [105, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const queuePeople = [
    { x: 450, color: "#3b82f6", skin: "#d4a574" },
    { x: 390, color: "#10b981", skin: "#fbbf24" },
    { x: 330, color: "#f59e0b", skin: "#c68642" },
    { x: 270, color: "#8b5cf6", skin: "#f1c27d" },
    { x: 210, color: "#06b6d4", skin: "#d4a574" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #fce7f3, #fde2e4)",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("voiceover/prologue2.mp3")} />
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

      {/* Counter desk */}
      <div
        style={{
          position: "absolute",
          right: 60,
          bottom: 200,
        }}
      >
        <div
          style={{
            width: 160,
            height: 90,
            background: "linear-gradient(180deg, #92400e, #78350f)",
            borderRadius: "8px 8px 0 0",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -80,
              left: "50%",
              transform: "translateX(-50%)",
              background: VALENTINE_COLORS.neutral,
              color: "#fff",
              padding: "6px 16px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: "bold",
              fontFamily: "Inter, system-ui, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            GUICHET
          </div>
        </div>
      </div>

      {/* Vigile / Guard */}
      <div style={{ position: "absolute", bottom: 200 }}>
        <VectorPerson
          x={530}
          y={0}
          scale={0.8}
          color="#1e293b"
          skinColor="#8d5524"
          expression={frame > 70 && frame < 90 ? "happy" : "neutral"}
          rotation={vigileNod}
        />
        {/* Guard badge */}
        <div
          style={{
            position: "absolute",
            left: 540,
            bottom: 60,
            background: "#fbbf24",
            color: "#1e293b",
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 10,
            fontWeight: "bold",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          VIGILE
        </div>
      </div>

      {/* Queue of honest people */}
      {queuePeople.map((person, i) => (
        <div key={i} style={{ position: "absolute", bottom: 200 }}>
          <VectorPerson
            x={person.x}
            y={0}
            scale={0.65}
            color={person.color}
            skinColor={person.skin}
            expression={frame > 100 ? "angry" : "tired"}
          />
        </div>
      ))}

      {/* Cheater person */}
      <div style={{ position: "absolute", bottom: 200 }}>
        <VectorPerson
          x={frame < 90 ? cheaterX : cheaterCutX}
          y={0}
          scale={0.7}
          color="#dc2626"
          skinColor="#fbbf24"
          expression="happy"
          accessory={frame < 80 ? "money" : "none"}
        />
      </div>

      {/* Money exchange animation */}
      {moneyOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            left: 540,
            bottom: 310 - moneyY,
            opacity: moneyOpacity,
            fontSize: 36,
            transform: `rotate(${interpolate(frame, [55, 90], [0, -15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}deg)`,
          }}
        >
          💵
        </div>
      )}

      {/* Handshake sparkle */}
      {frame > 75 && frame < 95 && (
        <div
          style={{
            position: "absolute",
            left: 545,
            bottom: 340,
            fontSize: 20,
            opacity: interpolate(frame, [75, 80, 90, 95], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          🤝
        </div>
      )}

      {/* Anger bubbles from queue */}
      {frame > 100 && (
        <>
          {queuePeople.slice(0, 3).map((person, i) => (
            <div
              key={`anger-${i}`}
              style={{
                position: "absolute",
                left: person.x + 25,
                bottom: 360 + i * 5,
                transform: `scale(${angerBubbles})`,
                background: "#fff",
                borderRadius: 16,
                padding: "6px 12px",
                fontSize: 18,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {i === 0 ? "😡" : i === 1 ? "🤬" : "😤"}
            </div>
          ))}
        </>
      )}

      {/* Text: Corruption */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 60,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
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
          Certains passent
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: "#dc2626",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          devant vous...
        </div>
      </div>

      {/* Angry sub-text */}
      <div
        style={{
          position: "absolute",
          top: 155,
          left: 60,
          opacity: angryTextOpacity,
          fontSize: 22,
          color: "#64748b",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 500,
        }}
      >
        Injuste. Frustrant. Inacceptable.
      </div>

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
