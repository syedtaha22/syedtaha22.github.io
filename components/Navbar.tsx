"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects/", label: "Projects" },
  { href: "/blog/", label: "Blog" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href.replace(/\/$/, ""));
}

/**
 * Lives in the root layout, so it stays mounted across route changes.
 * That is what lets the pill animate from one link to the next.
 */
export default function Navbar() {
  const pathname = usePathname();
  const current = LINKS.find((l) => isCurrent(pathname, l.href))?.href ?? "";
  const { ref, style } = useSlidingIndicator<HTMLElement>(current);

  return (
    <nav className="site-nav" id="site-nav" aria-label="Primary" ref={ref}>
      <span className="nav-indicator" aria-hidden="true" style={style} />
      {LINKS.map(({ href, label }) => {
        const active = href === current;
        return (
          <Link
            key={href}
            href={href}
            className={active ? "is-current" : undefined}
            aria-current={active ? "page" : undefined}
            data-active={active}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
