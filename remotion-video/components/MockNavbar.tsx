import React from "react";
import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";

type MockNavbarProps = {
  links: string[];
  activeLink?: string;
  delay?: number;
};

export const MockNavbar: React.FC<MockNavbarProps> = ({ links, activeLink, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#ede9fe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          🎯
        </div>
        <span
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#1e293b",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          SmartQueue
        </span>
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: 8 }}>
        {links.map((link, i) => {
          const linkProgress = spring({
            frame: frame - delay - i * 5,
            fps,
            config: { damping: 15, stiffness: 100 },
          });

          const isActive = link === activeLink;

          return (
            <div
              key={link}
              style={{
                opacity: interpolate(linkProgress, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(linkProgress, [0, 1], [10, 0])}px)`,
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive ? "bold" : "normal",
                background: isActive ? "#6366f1" : "transparent",
                color: isActive ? "#fff" : "#475569",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {link}
            </div>
          );
        })}
      </div>

      {/* User avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#6366f1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 14,
          fontWeight: "bold",
        }}
      >
        U
      </div>
    </div>
  );
};
