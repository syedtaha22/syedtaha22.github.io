import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { ChessBoard } from "@chess/frontend";
import { renderMarkdown } from "@/lib/markdown";
import "./chess.css";

export const metadata: Metadata = {
  title: { absolute: "Chess - Syed Taha" },
  description:
    "Play against a chess engine written in C++: alpha-beta search over bitboards, " +
    "served over HTTP.",
  alternates: { canonical: "/chess/" },
  openGraph: {
    type: "website",
    title: "Chess - Syed Taha",
    description: "Play against a chess engine written in C++.",
    url: "/chess/",
  },
};

// The engine runs as a separate service. Set NEXT_PUBLIC_CHESS_API_URL when building the
// site to point the board at it.
const API_BASE_URL = process.env.NEXT_PUBLIC_CHESS_API_URL ?? "http://localhost:8080";

export default async function ChessPage() {
  // The description is markdown, so that its citations are footnotes like the ones in a post.
  const source = fs.readFileSync(path.join(process.cwd(), "app/chess/about.md"), "utf-8");
  const { html: about } = await renderMarkdown(source);

  return (
    <main>
      <div className="wrap">
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)" }}>Chess</h1>
        <p className="prose">
          An alpha-beta chess engine written in C++. Play against it below.
        </p>
      </div>

      <div className="chess-stage">
        <ChessBoard apiBaseUrl={API_BASE_URL} />
      </div>

      <div className="wrap chess-about">
        <h2>About the engine</h2>
        <div className="prose" dangerouslySetInnerHTML={{ __html: about }} />
      </div>
    </main>
  );
}
