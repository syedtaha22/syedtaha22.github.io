"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { BlogIcon, HomeIcon, ProjectsIcon } from "@/components/icons";
import { useCutoutMask } from "@/hooks/useCutoutMask";
import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";

const LINKS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/projects/", label: "Projects", Icon: ProjectsIcon },
  { href: "/blog/", label: "Blog", Icon: BlogIcon },
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

  const pillStyle = { ...style, "--pill-x": `${style.left}px` } as CSSProperties;

  return (
    <nav className="site-nav" id="site-nav" aria-label="Primary" ref={ref}>
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
