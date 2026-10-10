"use client";

import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import type { TocEntry } from "@/lib/markdown";

/**
 * Scrolls to a heading and records it in the address bar without adding a
 * history entry, so the back button leaves the post instead of stepping
 * through every section that was clicked.
 */
function jumpTo(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  window.history.replaceState(window.history.state, "", `#${id}`);
}

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
                <a href={`#${h.id}`} onClick={(e) => jumpTo(e, h.id)}>
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
