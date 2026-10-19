import type { Metadata } from "next";
import Link from "next/link";
import NotFoundMessage from "@/components/NotFoundMessage";

export const metadata: Metadata = {
  title: { absolute: "Page not found - Syed Taha" },
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="wrap not-found">
      <p className="eyebrow">404</p>
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)" }}>Page not found</h1>
      <NotFoundMessage />
      <Link href="/" className="btn btn-fill">
        Go home
      </Link>
    </main>
  );
}
