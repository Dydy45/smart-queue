import React from "react";

type VectorPersonProps = {
  x: number;
  y: number;
  scale?: number;
  color?: string;
  skinColor?: string;
  expression?: "neutral" | "happy" | "angry" | "tired" | "shocked";
  accessory?: "none" | "briefcase" | "phone" | "money" | "watch";
  opacity?: number;
  rotation?: number;
};

export const VectorPerson: React.FC<VectorPersonProps> = ({
  x,
  y,
  scale = 1,
  color = "#6366f1",
  skinColor = "#fbbf24",
  expression = "neutral",
  accessory = "none",
  opacity = 1,
  rotation = 0,
}) => {
  const eyeStyle = (): { left: string; right: string } => {
    switch (expression) {
      case "happy":
        return { left: "◡", right: "◡" };
      case "angry":
        return { left: "╬", right: "╬" };
      case "tired":
        return { left: "—", right: "—" };
      case "shocked":
        return { left: "⊙", right: "⊙" };
      default:
        return { left: "•", right: "•" };
    }
  };

  const mouth = (): string => {
    switch (expression) {
      case "happy":
        return "◡";
      case "angry":
        return "︵";
      case "tired":
        return "~";
      case "shocked":
        return "○";
      default:
        return "—";
    }
  };

  const eyes = eyeStyle();

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        opacity,
        transformOrigin: "center bottom",
      }}
    >
      {/* Head */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: skinColor,
          position: "relative",
          marginLeft: 7,
          marginBottom: -2,
          zIndex: 2,
        }}
      >
        {/* Eyes */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 7,
            fontSize: 10,
            display: "flex",
            gap: 8,
            color: "#1e293b",
            fontWeight: "bold",
          }}
        >
          <span>{eyes.left}</span>
          <span>{eyes.right}</span>
        </div>
        {/* Mouth */}
        <div
          style={{
            position: "absolute",
            bottom: 6,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            color: "#1e293b",
          }}
        >
          {mouth()}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          width: 50,
          height: 60,
          borderRadius: "12px 12px 4px 4px",
          background: color,
          position: "relative",
          zIndex: 1,
        }}
      />

      {/* Legs */}
      <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
        <div
          style={{
            width: 14,
            height: 30,
            borderRadius: "0 0 4px 4px",
            background: "#475569",
          }}
        />
        <div
          style={{
            width: 14,
            height: 30,
            borderRadius: "0 0 4px 4px",
            background: "#475569",
          }}
        />
      </div>

      {/* Accessories */}
      {accessory === "briefcase" && (
        <div
          style={{
            position: "absolute",
            right: -18,
            top: 55,
            width: 20,
            height: 16,
            borderRadius: 3,
            background: "#92400e",
            border: "2px solid #78350f",
          }}
        />
      )}
      {accessory === "phone" && (
        <div
          style={{
            position: "absolute",
            right: -12,
            top: 48,
            width: 10,
            height: 18,
            borderRadius: 3,
            background: "#1e293b",
            border: "1px solid #475569",
          }}
        />
      )}
      {accessory === "money" && (
        <div
          style={{
            position: "absolute",
            right: -20,
            top: 45,
            fontSize: 20,
          }}
        >
          💵
        </div>
      )}
      {accessory === "watch" && (
        <div
          style={{
            position: "absolute",
            left: -8,
            top: 52,
            fontSize: 16,
          }}
        >
          ⌚
        </div>
      )}
    </div>
  );
};
