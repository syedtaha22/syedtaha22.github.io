"use client";

import { useEffect } from "react";

const COPY_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CHECK_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

/**
 * Adds a copy-to-clipboard button to each code block in the post body: a
 * copy icon top-right that swaps to a checkmark for 1.5s after a click.
 * The post HTML is static, so this runs client-side after it mounts.
 *
 * Each <pre> is wrapped in a plain div that holds the button. <pre> is the
 * element that scrolls horizontally, and a button inside it would scroll
 * away with the code instead of staying pinned to the corner.
 */
export default function CodeBlockEnhancer({ slug }: { slug: string }) {
  useEffect(() => {
    const timers: number[] = [];
    const blocks = document.querySelectorAll<HTMLPreElement>(
      "#post-content pre:not([data-enhanced])"
    );

    blocks.forEach((pre) => {
      pre.dataset.enhanced = "true";
      const code = pre.querySelector("code");
      if (!code) return;

      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.setAttribute("aria-label", "Copy code");
      button.innerHTML = COPY_ICON;
      button.addEventListener("click", async () => {
        await navigator.clipboard.writeText(code.textContent ?? "");
        button.innerHTML = CHECK_ICON;
        timers.push(window.setTimeout(() => (button.innerHTML = COPY_ICON), 1500));
      });
      wrapper.appendChild(button);
    });

    return () => timers.forEach(window.clearTimeout);
  }, [slug]);

  return null;
}
