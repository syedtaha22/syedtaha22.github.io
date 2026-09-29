"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Tabs from "@/components/Tabs";
import type { PostMeta } from "@/lib/posts";

const POSTS_PER_PAGE = 5;

function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link className="post-card" href={`/blog/${post.slug}/`}>
      <h3>{post.title}</h3>
      <div className="meta">
        <span>{post.longDate}</span>
        <span>{post.category}</span>
        <span>{post.readTime} min read</span>
      </div>
      <p>{post.excerpt}</p>
      <span className="read-more">Read More</span>
    </Link>
  );
}

/**
 * Category tabs, search, and pagination for the blog index. Posts arrive
 * sorted newest first. While a tab or search is active, pagination is
 * hidden and the full matching set is shown, same as the repo list.
 */
export default function BlogIndex({ posts }: { posts: PostMeta[] }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const tabs = useMemo(() => {
    const categories = [...new Set(posts.map((p) => p.category))].sort();
    return [{ key: "all", label: "All" }, ...categories.map((c) => ({ key: c, label: c }))];
  }, [posts]);

  const featured = posts.slice(0, 3);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);
  }, [posts]);

  const q = query.trim().toLowerCase();
  const filtering = category !== "all" || q !== "";

  let visible = posts;
  if (category !== "all") visible = visible.filter((p) => p.category === category);
  if (q) {
    visible = visible.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  if (!filtering) {
    visible = posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);
  }

  return (
    <div className="blog-layout">
      <aside className="col-side">
        <div className="sidebar-widget">
          <h4>Featured</h4>
          <div id="featured-posts">
            {featured.map((post) => (
              <Link key={post.slug} className="featured-item" href={`/blog/${post.slug}/`}>
                <span className="f-title">{post.title}</span>
                <span className="f-date">{post.shortDate}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="sidebar-widget">
          <h4>Tags</h4>
          <div className="tag-cloud" id="tags-cloud">
            {tags.map((tag) => (
              <a
                key={tag}
                href="#"
                className="tag"
                onClick={(e) => {
                  e.preventDefault();
                  setQuery(tag);
                }}
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      </aside>

      <div className="col-main">
        <div className="blog-controls">
          <Tabs id="category-tabs" tabs={tabs} active={category} onChange={setCategory} />
          <input
            type="search"
            id="post-search"
            className="search-input"
            placeholder="Search posts…"
            aria-label="Search posts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {visible.length > 0 ? (
          <div id="posts-container">
            {visible.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p id="posts-empty" className="prose">
            No posts match here.
          </p>
        )}

        {!filtering && (
          <div id="pagination">
            <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
              &larr; Previous
            </button>
            <span id="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
