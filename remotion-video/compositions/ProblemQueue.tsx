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

export const ProblemQueue: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Person walks in (0-40)
  const personEnterX = interpolate(frame, [0, 40], [-100, 700], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: Sees the queue (40-60) - shocked reaction
  const shockBubble = spring({
    frame: frame - 45,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Queue people appear staggered (10-50)
  const queuePeople = [
    { x: 480, delay: 5, color: "#3b82f6", skin: "#d4a574" },
    { x: 420, delay: 8, color: "#10b981", skin: "#fbbf24" },
    { x: 360, delay: 11, color: "#f59e0b", skin: "#c68642" },
    { x: 300, delay: 14, color: "#8b5cf6", skin: "#f1c27d" },
    { x: 240, delay: 17, color: "#ec4899", skin: "#d4a574" },
    { x: 180, delay: 20, color: "#06b6d4", skin: "#8d5524" },
    { x: 120, delay: 23, color: "#f97316", skin: "#fbbf24" },
    { x: 60, delay: 26, color: "#14b8a6", skin: "#c68642" },
  ];

  // Counter/desk animation
  const deskOpacity = spring({
    frame: frame - 3,
    fps,
    config: { damping: 15 },
  });

  // Text overlays
  const text1Opacity = interpolate(frame, [60, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const text1Y = interpolate(frame, [60, 75], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Clock ticking
  const clockAngle = interpolate(frame, [0, 600], [0, 720]);

  // Frustration indicators (people shifting)
  const shiftAmount = Math.sin(frame * 0.08) * 3;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #fef3c7, #fde68a)",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("voiceover/prologue1.mp3")} />
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

      {/* Wall pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          width: "100%",
          height: "100%",
          background:
            "repeating-linear-gradient(90deg, transparent, transparent 200px, rgba(0,0,0,0.03) 200px, rgba(0,0,0,0.03) 201px)",
        }}
      />

      {/* Clock on wall */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 120,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "#fff",
          border: "4px solid #1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        {/* Clock hand */}
        <div
          style={{
            position: "absolute",
            width: 3,
            height: 28,
            background: "#1e293b",
            borderRadius: 2,
            transformOrigin: "bottom center",
            transform: `rotate(${clockAngle}deg)`,
            bottom: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 3,
            height: 20,
            background: VALENTINE_COLORS.primary,
            borderRadius: 2,
            transformOrigin: "bottom center",
            transform: `rotate(${clockAngle * 12}deg)`,
            bottom: "50%",
          }}
        />
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#1e293b",
            zIndex: 2,
          }}
        />
      </div>

      {/* Counter desk */}
      <div
        style={{
          position: "absolute",
          right: 80,
          bottom: 200,
          opacity: deskOpacity,
        }}
      >
        {/* Desk surface */}
        <div
          style={{
            width: 180,
            height: 100,
            background: "linear-gradient(180deg, #92400e, #78350f)",
            borderRadius: "8px 8px 0 0",
            position: "relative",
          }}
        >
          {/* Screen */}
          <div
            style={{
              position: "absolute",
              top: -50,
              left: 30,
              width: 60,
              height: 45,
              background: "#1e293b",
              borderRadius: 4,
              border: "3px solid #374151",
            }}
          >
            <div
              style={{
                width: "80%",
                height: 3,
                background: "#22c55e",
                borderRadius: 2,
                margin: "12px auto 0",
              }}
            />
          </div>
          {/* Sign "GUICHET" */}
          <div
            style={{
              position: "absolute",
              top: -85,
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
            GUICHET 1
          </div>
        </div>
        {/* Clerk behind desk */}
        <div style={{ position: "absolute", top: -90, left: 60 }}>
          <VectorPerson
            x={0}
            y={0}
            scale={0.7}
            color="#1e293b"
            skinColor="#d4a574"
            expression="tired"
          />
        </div>
      </div>

      {/* Queue rope barriers */}
      <div
        style={{
          position: "absolute",
          bottom: 260,
          left: 40,
          right: 280,
          height: 4,
          background: VALENTINE_COLORS.primary,
          opacity: 0.4,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 310,
          left: 40,
          right: 280,
          height: 4,
          background: VALENTINE_COLORS.primary,
          opacity: 0.4,
        }}
      />

      {/* Queue of people */}
      {queuePeople.map((person, i) => {
        const personSpring = spring({
          frame: frame - person.delay,
          fps,
          config: { damping: 15 },
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: 200,
              transform: `translateY(${shiftAmount * (i % 2 === 0 ? 1 : -1)}px)`,
            }}
          >
            <VectorPerson
              x={person.x}
              y={0}
              scale={0.65 * personSpring}
              color={person.color}
              skinColor={person.skin}
              expression={i < 3 ? "angry" : "tired"}
              accessory={i === 2 ? "briefcase" : i === 5 ? "phone" : "none"}
            />
          </div>
        );
      })}

      {/* Main character entering */}
      <div style={{ position: "absolute", bottom: 200 }}>
        <VectorPerson
          x={personEnterX}
          y={0}
          scale={0.75}
          color="#e96d7b"
          skinColor="#fbbf24"
          expression={frame > 40 ? "shocked" : "neutral"}
          accessory="briefcase"
        />
      </div>

      {/* Shock reaction bubble */}
      {frame > 40 && (
        <div
          style={{
            position: "absolute",
            left: personEnterX + 45,
            bottom: 370,
            transform: `scale(${shockBubble})`,
            background: "#fff",
            borderRadius: 20,
            padding: "10px 18px",
            fontSize: 28,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            border: "2px solid #e5e7eb",
          }}
        >
          😱
          {/* Bubble tail */}
          <div
            style={{
              position: "absolute",
              bottom: -10,
              left: 20,
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "12px solid #fff",
            }}
          />
        </div>
      )}

      {/* Text overlay */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 80,
          opacity: text1Opacity,
          transform: `translateY(${text1Y}px)`,
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: "#1e293b",
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.2,
          }}
        >
          Des files d&apos;attente
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: VALENTINE_COLORS.primary,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          interminables...
        </div>
      </div>

      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.15) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
