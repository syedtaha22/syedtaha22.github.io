"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BlogIcon, HomeIcon, ProjectsIcon } from "@/components/icons";
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
 */
export default function Navbar() {
  const pathname = usePathname();
  const current = LINKS.find((l) => isCurrent(pathname, l.href))?.href ?? "";
  const { ref, style } = useSlidingIndicator<HTMLElement>(current);

  return (
    <nav className="site-nav" id="site-nav" aria-label="Primary" ref={ref}>
      <span className="nav-indicator" aria-hidden="true" style={style} />
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
