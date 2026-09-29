import type { Metadata } from "next";
import BlogIndex from "@/components/BlogIndex";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: { absolute: "Blog - Syed Taha" },
  description: "Notes on systems programming, machine learning, and low-level computing, by Syed Taha.",
  keywords:
    "Syed Taha, systems programming, RISC-V, machine learning, low-level computing, high-performance computing, technical writing, blog",
  alternates: { canonical: "/blog/" },
};

export default function BlogPage() {
  return (
    <main className="wrap">
      <header className="blog-header">
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)" }}>Blog</h1>
        <p className="prose" style={{ margin: "0 auto" }}>
          Things I&apos;ve built, learned, or figured out along the way.
        </p>
        <hr className="blog-rule" />
      </header>

      <BlogIndex posts={getAllPosts()} />
    </main>
  );
}
