"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Pref = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";
const LABEL_DURATION_MS = 2000;
const OPTIONS: { value: Pref; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function readPref(): Pref {
  try {
    return (localStorage.getItem(STORAGE_KEY) as Pref) || "system";
  } catch {
    return "system";
  }
}

// localStorage is the source of truth; this lets React re-render when it changes.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function applyTheme(pref: Pref) {
  const dark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

/**
 * Light / dark / system dropdown. The initial theme is applied before
 * paint by the inline script in the root layout; this component owns
 * the menu and keeps "system" in sync with the OS setting.
 */
export default function ThemeSwitcher() {
  const pref = useSyncExternalStore(subscribe, readPref, () => "system" as Pref);
  // `shown` controls the hidden attribute, `open` the animated class,
  // so the menu can fade out before it is hidden.
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  // After picking a theme, the trigger briefly expands from a dot into a
  // "Theme: X" pill as confirmation, then collapses on its own.
  const [showLabel, setShowLabel] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const labelTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readPref() === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => () => window.clearTimeout(labelTimer.current), []);

  function openMenu() {
    window.clearTimeout(closeTimer.current);
    setShown(true);
    requestAnimationFrame(() => setOpen(true));
  }

  function closeMenu() {
    setOpen(false);
    closeTimer.current = window.setTimeout(() => setShown(false), 200);
  }

  useEffect(() => {
    if (!shown) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [shown]);

  function choose(value: Pref) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    listeners.forEach((l) => l());
    applyTheme(value);
    closeMenu();

    setShowLabel(true);
    window.clearTimeout(labelTimer.current);
    labelTimer.current = window.setTimeout(() => setShowLabel(false), LABEL_DURATION_MS);
  }

  return (
    <div className="theme-switcher" id="theme-switcher" ref={wrapRef}>
      <button
        className={showLabel ? "theme-trigger has-label" : "theme-trigger"}
        id="theme-trigger"
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Change theme"
        onClick={() => (shown ? closeMenu() : openMenu())}
      >
        <span className="swatch" aria-hidden="true" />
        <span className="theme-label" aria-hidden="true">
          Theme: {OPTIONS.find((o) => o.value === pref)?.label}
        </span>
      </button>
      <div
        className={open ? "theme-menu is-open" : "theme-menu"}
        id="theme-menu"
        role="menu"
        hidden={!shown}
      >
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            className={pref === value ? "theme-option is-active" : "theme-option"}
            type="button"
            role="menuitem"
            onClick={() => choose(value)}
          >
            <span className="option-dot" data-choice={value} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
