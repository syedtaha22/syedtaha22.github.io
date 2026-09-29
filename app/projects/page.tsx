import type { Metadata } from "next";
import Link from "next/link";
import ProjectCarousel from "@/components/ProjectCarousel";
import RepoList from "@/components/RepoList";
import { PROJECTS } from "@/lib/projects";

export const metadata: Metadata = {
  title: { absolute: "Projects - Syed Taha" },
  description:
    "Projects by Syed Taha: systems programming, machine learning, and high-performance computing, plus a live list of public GitHub repositories.",
  keywords:
    "Syed Taha, systems programming, RISC-V, machine learning, LLM inference, xv6, physics engine, Othello AI, IBA Karachi",
  alternates: { canonical: "/projects/" },
  openGraph: {
    type: "website",
    title: "Projects - Syed Taha",
    description:
      "Systems programming, machine learning, and high-performance computing projects, plus a live GitHub repository list.",
    url: "/projects/",
  },
};

export default function ProjectsPage() {
  return (
    <main className="wrap">
      <section>
        <p className="eyebrow">Projects</p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)" }}>Things I&apos;ve built</h1>
        <p className="prose">
          A mix of research and personal work, mostly around systems programming, machine learning,
          and high-performance computing. Write-ups for some of these live on the{" "}
          <Link href="/blog/">blog</Link>.
        </p>
      </section>

      <section className="block">
        <ProjectCarousel projects={PROJECTS} />
      </section>

      <section className="block">
        <p className="eyebrow">GitHub</p>
        <h2>Public repositories</h2>
        <p className="prose" style={{ marginBottom: "1.6rem" }}>
          Pulled live from the GitHub API, so this list stays current without upkeep: everything
          public and not a fork. Repositories pushed to in the last 6 months are Active; older ones
          move to Archived; anything without a description is tucked under Other.
        </p>

        <RepoList />

        <p style={{ marginTop: "1.8rem", fontFamily: "var(--mono)", fontSize: "0.86rem" }}>
          <a href="https://github.com/syedtaha22">Full profile on GitHub →</a>
        </p>
      </section>
    </main>
  );
}
