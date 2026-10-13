"use client";

import { useEffect, useRef, useState } from "react";
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
 * The heading above 25% of the viewport height that is closest to it. It is computed on every
 * scroll, so a fast jump through the post still lands on the right entry.
 */
function useScrollSpy(entries: TocEntry[]) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const update = () => {
      const line = window.innerHeight * 0.25;
      let current = headings[0];
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= line) current = heading;
        else break;
      }
      setActiveId(current.id);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [entries]);

  return activeId;
}

/**
 * "On this page" list. A sidebar on wide screens; on narrow screens it
 * sits above the post and starts collapsed so it doesn't push the
 * article off the first screen.
 */
export default function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const activeId = useScrollSpy(entries);
  const listRef = useRef<HTMLDivElement>(null);

  // Keeps the active entry inside the list when the list is taller than the space it has.
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (!list || !active) return;

    const margin = 16;
    const listBox = list.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    if (activeBox.top - margin < listBox.top) {
      list.scrollBy({ top: activeBox.top - margin - listBox.top, behavior: "smooth" });
    } else if (activeBox.bottom + margin > listBox.bottom) {
      list.scrollBy({ top: activeBox.bottom + margin - listBox.bottom, behavior: "smooth" });
    }
  }, [activeId]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 860px)").matches && ref.current) {
      ref.current.open = false;
    }
  }, []);

  return (
    <details id="toc-sidebar" ref={ref} open>
      <summary id="toc-title">On this page</summary>
      <div id="toc-content" ref={listRef}>
        {entries.length === 0 ? (
          <p style={{ fontSize: "0.9rem", color: "#999" }}>No sections</p>
        ) : (
          <ul>
            {entries.map((h) => (
              <li key={h.id} className={h.level === 3 ? "toc-sub" : undefined}>
                <a
                  href={`#${h.id}`}
                  data-active={activeId === h.id}
                  onClick={(e) => jumpTo(e, h.id)}
                >
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
