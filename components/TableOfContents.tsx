"use client";

import { useEffect, useRef } from "react";
import type { TocEntry } from "@/lib/markdown";

/**
 * "On this page" list. A sidebar on wide screens; on narrow screens it
 * sits above the post and starts collapsed so it doesn't push the
 * article off the first screen.
 */
export default function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 860px)").matches && ref.current) {
      ref.current.open = false;
    }
  }, []);

  return (
    <details id="toc-sidebar" ref={ref} open>
      <summary id="toc-title">On this page</summary>
      <div id="toc-content">
        {entries.length === 0 ? (
          <p style={{ fontSize: "0.9rem", color: "#999" }}>No sections</p>
        ) : (
          <ul>
            {entries.map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`}>{h.text}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
