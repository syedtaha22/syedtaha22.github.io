"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { BlogIcon, ChessIcon, HomeIcon, ProjectsIcon } from "@/components/icons";
import { useCutoutMask } from "@/hooks/useCutoutMask";
import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";

const LINKS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/projects/", label: "Projects", Icon: ProjectsIcon },
  { href: "/blog/", label: "Blog", Icon: BlogIcon },
  { href: "/chess/", label: "Chess", Icon: ChessIcon },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href.replace(/\/$/, ""));
}

/**
 * Lives in the root layout, so it stays mounted across route changes.
 * That is what lets the pill animate from one link to the next.
 *
 * The link labels are cut out of the glass and out of the pill (see
 * useCutoutMask), so the page shows through the letters. The links
 * themselves are transparent and only provide the hit area.
 */
export default function Navbar() {
  const pathname = usePathname();
  const current = LINKS.find((l) => isCurrent(pathname, l.href))?.href ?? "";
  const { ref, style } = useSlidingIndicator<HTMLElement>(current);
  useCutoutMask(ref);

  // Hides on scroll down, returns on scroll up and near the top of the page.
  // It also hides when scrolling stops, and returns when scrolling resumes.
  const [hidden, setHidden] = useState(false);
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    const DOWN = 6;
    const UP = 2;
    const TOP = 80;
    let last = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const delta = y - last;
      if (y < TOP) {
        setHidden(false);
        last = y;
      } else if (delta > DOWN) {
        setHidden(true);
        last = y;
      } else if (delta < -UP) {
        setHidden(false);
        last = y;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const IDLE_MS = 3000;
    const REACH = 80;
    let timer = 0;

    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const nav = ref.current;
        // Stay put while the pointer or focus is on the bar.
        if (nav && (nav.matches(":hover") || nav.matches(":focus-within"))) {
          arm();
          return;
        }
        setIdle(true);
      }, IDLE_MS);
    };

    const wake = () => {
      setIdle(false);
      arm();
    };

    // Scrolling is the activity that keeps the bar out. A pointer reaching
    // the top edge, or a touch, also brings it back, so a page too short to
    // scroll cannot strand it out of view.
    const onPointerMove = (e: PointerEvent) => {
      if (e.clientY < REACH) wake();
    };

    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchstart", wake, { passive: true });
    arm();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchstart", wake);
    };
  }, [ref]);

  const pillStyle = { ...style, "--pill-x": `${style.left}px` } as CSSProperties;

  return (
    <nav
      className={hidden || idle ? "site-nav is-hidden" : "site-nav"}
      id="site-nav"
      aria-label="Primary"
      ref={ref}
    >
      <span className="nav-shadow" aria-hidden="true" />
      <span className="nav-glass nav-cutout" aria-hidden="true" />
      <span className="nav-indicator nav-cutout" aria-hidden="true" style={pillStyle} />
      {LINKS.map(({ href, label, Icon }) => {
        const active = href === current;
        return (
          <Link
            key={href}
            href={href}
            className={active ? "is-current" : undefined}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            title={label}
            data-active={active}
          >
            <span className="nav-label">{label}</span>
            <span className="nav-icon" aria-hidden="true">
              <Icon />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
