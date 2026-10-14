import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { ChessBoard } from "@/components/chess";
import { renderMarkdown } from "@/lib/markdown";
import "./chess.css";

export const metadata: Metadata = {
  title: { absolute: "Meridian, a chess engine - Syed Taha" },
  description:
    "Play against Meridian, a chess engine written in C++: alpha-beta search over " +
    "bitboards, served over HTTP.",
  alternates: { canonical: "/meridian/" },
  openGraph: {
    type: "website",
    title: "Meridian, a chess engine - Syed Taha",
    description: "Play against Meridian, a chess engine written in C++.",
    url: "/meridian/",
  },
};

// The engine runs as a separate service. Set NEXT_PUBLIC_CHESS_API_URL when building the
// site to point the board at it.
const API_BASE_URL = process.env.NEXT_PUBLIC_CHESS_API_URL ?? "http://localhost:8080";

export default async function ChessPage() {
  // The description is markdown, so that its citations are footnotes like the ones in a post.
  const source = fs.readFileSync(path.join(process.cwd(), "app/meridian/about.md"), "utf-8");
  const { html: about } = await renderMarkdown(source);

  return (
    <main>
      <div className="wrap">
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)" }}>Meridian</h1>
        <p className="prose" style={{ maxWidth: "62rem" }}>
          A chess engine written in C++, with alpha-beta search over bitboards. Play against it below.
        </p>
      </div>

      <div className="chess-stage">
        <ChessBoard apiBaseUrl={API_BASE_URL} />
      </div>

      <div className="wrap chess-about">
        <h2>About Meridian</h2>
        <div className="prose" dangerouslySetInnerHTML={{ __html: about }} />
      </div>
    </main>
  );
}
