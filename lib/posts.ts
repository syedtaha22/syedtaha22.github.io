import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");
const POSTS_DIR = path.join(CONTENT_DIR, "posts");

type RawPost = {
  id: number;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  category: string;
  tags: string[];
  filename: string;
  featured_image: string | null;
  readTime: number;
  status: string;
};

/** Serializable post metadata, safe to pass to client components. */
export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  longDate: string;
  shortDate: string;
  author: string;
  excerpt: string;
  category: string;
  tags: string[];
  readTime: number;
  filename: string;
};

// Dates are formatted here, in UTC, so the server and every browser
// agree on the day regardless of timezone.
function formatDate(iso: string, month: "long" | "short") {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
    timeZone: "UTC",
  });
}

function toMeta(raw: RawPost): PostMeta {
  return {
    slug: path.parse(raw.filename).name.replace(/^\d+-/, ""),
    title: raw.title,
    date: raw.date,
    longDate: formatDate(raw.date, "long"),
    shortDate: formatDate(raw.date, "short"),
    author: raw.author,
    excerpt: raw.excerpt,
    category: raw.category,
    tags: raw.tags,
    readTime: raw.readTime,
    filename: raw.filename,
  };
}

/** All published posts, newest first. */
export function getAllPosts(): PostMeta[] {
  const raw = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, "posts.json"), "utf-8"));
  return (raw.posts as RawPost[])
    .filter((p) => p.status === "published")
    .map(toMeta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): PostMeta | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getPostMarkdown(post: PostMeta): string {
  const source = fs.readFileSync(path.join(POSTS_DIR, post.filename), "utf-8");
  return source
    .replace(/\r\n/g, "\n")
    .replace(/^# .+\n\n/, ""); // the title is already rendered in the page header
}
