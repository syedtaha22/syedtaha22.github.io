import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/**
 * Drives a pill that slides behind whichever child of a container is
 * marked `data-active="true"`. Attach `ref` to the container and spread
 * `style` onto the indicator element (a direct child, absolutely
 * positioned by CSS).
 *
 * The first measurement is applied without a transition so the pill
 * doesn't slide in from the corner on mount. Later changes animate.
 * Children are watched with a ResizeObserver, so label changes (e.g.
 * counts appended to tabs) and font loading keep it aligned.
 */
export function useSlidingIndicator<T extends HTMLElement>(activeKey: string) {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;

    const measure = () => {
      const active = container.querySelector<HTMLElement>('[data-active="true"]');
      if (!active) return;
      const next = { left: active.offsetLeft, width: active.offsetWidth };
      setBox((prev) =>
        prev && prev.left === next.left && prev.width === next.width ? prev : next
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    Array.from(container.children).forEach((child) => {
      if (child instanceof HTMLElement && child.dataset.active !== undefined) {
        observer.observe(child);
      }
    });
    return () => observer.disconnect();
  }, [activeKey]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const style: CSSProperties = {
    left: box?.left ?? 0,
    width: box?.width ?? 0,
    transition: ready ? undefined : "none",
  };

  return { ref, style };
}
