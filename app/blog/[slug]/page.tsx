import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import CodeBlockEnhancer from "@/components/CodeBlockEnhancer";
import TableOfContents from "@/components/TableOfContents";
import { renderMarkdown } from "@/lib/markdown";
import { getAllPosts, getPost, getPostMarkdown } from "@/lib/posts";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = `/blog/${post.slug}/`;
  return {
    title: { absolute: `${post.title} - Syed Taha` },
    description: post.excerpt,
    keywords: post.tags.join(", "),
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  const { html, toc } = await renderMarkdown(getPostMarkdown(post));

  return (
    <main className="wrap">
      <header className="post-header blog-header">
        <h1 style={{ fontSize: "clamp(1.9rem, 4vw, 2.5rem)" }}>{post.title}</h1>
        <p style={{ color: "var(--ink-soft)" }}>{post.excerpt}</p>
        <div className="meta">
          <span>{post.author}</span>
          <span>{post.longDate}</span>
          <span>{post.category}</span>
          <span>{post.readTime} min read</span>
        </div>
        <div className="post-tags">
          {post.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
        <hr className="blog-rule" />
      </header>

      <div className="post-single-layout">
        <div>
          <article id="post-content" dangerouslySetInnerHTML={{ __html: html }} />
          <CodeBlockEnhancer slug={post.slug} />
        </div>
        <aside>
          <TableOfContents entries={toc} />
        </aside>
      </div>
    </main>
  );
}
