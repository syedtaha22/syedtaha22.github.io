"use client";

import { useRef, useSyncExternalStore } from "react";
import { NOT_FOUND_MESSAGES } from "@/lib/not-found-messages";

const FALLBACK = "This page does not exist or has moved.";

const subscribe = () => () => {};

/**
 * A random line for the 404 page. The page is exported as static HTML, so the choice is made in
 * the browser: the server render has no message, the client picks one once, when the page
 * mounts, and it stays the same for as long as the page is shown. The line is hidden until it
 * is chosen, so that a fixed line does not flash first, and a plain line is shown without
 * JavaScript.
 */
export default function NotFoundMessage() {
  const picked = useRef<string | null>(null);
  const message = useSyncExternalStore(
    subscribe,
    () => (picked.current ??= NOT_FOUND_MESSAGES[Math.floor(Math.random() * NOT_FOUND_MESSAGES.length)]),
    () => null,
  );

  return (
    <>
      <p
        className="prose"
        style={{ marginBottom: "1.6rem", visibility: message ? "visible" : "hidden" }}
      >
        {message ?? FALLBACK}
      </p>
      <noscript>
        <p className="prose" style={{ marginBottom: "1.6rem" }}>
          {FALLBACK}
        </p>
      </noscript>
    </>
  );
}
