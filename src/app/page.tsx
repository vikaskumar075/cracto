"use client";

import { useState } from "react";
import { Release } from "@/types";
import { ReleaseList } from "@/components/features/ReleaseList";
import { ReleaseDetail } from "@/components/features/ReleaseDetail";

export default function HomePage() {
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Top navigation bar */}
      <header
        style={{
          backgroundColor: "#1f2937",
          padding: "0 24px",
          height: "40px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "#e5e7eb",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          release.tool
        </span>
      </header>

      {/* Main content */}
      <main
        style={{
          maxWidth: "820px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        {/* Page header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}
          >
            ReleaseCheck
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            Your all-in-one release checklist tool
          </p>
        </div>

        {/* View */}
        {selectedRelease ? (
          <ReleaseDetail
            releaseId={selectedRelease.id}
            onBack={() => setSelectedRelease(null)}
          />
        ) : (
          <ReleaseList onSelectRelease={setSelectedRelease} />
        )}
      </main>
    </div>
  );
}
