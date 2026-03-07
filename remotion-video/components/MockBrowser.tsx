import React from "react";

type MockBrowserProps = {
  url: string;
  children: React.ReactNode;
};

export const MockBrowser: React.FC<MockBrowserProps> = ({ url, children }) => {
  return (
    <div
      style={{
        width: 1400,
        height: 800,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Browser top bar */}
      <div
        style={{
          height: 48,
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#eab308" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
        </div>
        {/* URL bar */}
        <div
          style={{
            flex: 1,
            height: 30,
            background: "#fff",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            fontSize: 14,
            color: "#64748b",
            fontFamily: "monospace",
            border: "1px solid #e2e8f0",
          }}
        >
          {url}
        </div>
      </div>
      {/* Browser content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
    </div>
  );
};
