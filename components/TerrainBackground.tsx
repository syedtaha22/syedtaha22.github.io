"use client";

import { useEffect, useRef } from "react";
import { startTerrain } from "@/lib/terrain";

export default function TerrainBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return startTerrain(ref.current);
  }, []);

  return (
    <canvas
      id="terrain-bg"
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
