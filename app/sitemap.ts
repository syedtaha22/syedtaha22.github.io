import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-static";

const BASE = "https://syedtaha22.github.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const latest = posts[0]?.date;
  return [
    { url: `${BASE}/`, lastModified: latest },
    { url: `${BASE}/projects/`, lastModified: latest },
    { url: `${BASE}/blog/`, lastModified: latest },
    ...posts.map((p) => ({ url: `${BASE}/blog/${p.slug}/`, lastModified: p.date })),
  ];
}
