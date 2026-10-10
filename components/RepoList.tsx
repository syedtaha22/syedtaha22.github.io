"use client";

import { useEffect, useMemo, useState } from "react";
import { ActivityIcon, ArchiveIcon, EllipsisIcon, ListFilterIcon } from "@/components/icons";
import Tabs from "@/components/Tabs";
import type { TabItem } from "@/components/Tabs";

/**
 * Pulls public, non-fork repositories from the GitHub REST API and shows
 * them as a searchable, tabbed card grid. Push a new repo on GitHub and
 * it shows up here on next page load, sorted into the right tab.
 *
 * Tabs:
 *   Active   - pushed to within the last 6 months, has a description
 *   Inactive - last push more than 6 months ago
 *
 * Repos archived on GitHub (the `archived` flag in the API response) are
 * dropped entirely.
 *   Other    - no description set, regardless of activity
 *
 * Uses the unauthenticated API (60 req/hr per IP), which is well within
 * limits for a personal site.
 */

const USERNAME = "syedtaha22";
const EXCLUDE = new Set<string>(); // repo names to hide, if ever needed
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;

const LANG_COLORS: Record<string, string> = {
  "C++": "#f34b7d", C: "#555555", Python: "#3572A5",
  JavaScript: "#f1e05a", TypeScript: "#3178c6", "Jupyter Notebook": "#DA5B0B",
  Assembly: "#6E4C13", HTML: "#e34c26", CSS: "#563d7c", Rust: "#dea584",
  Go: "#00ADD8", Shell: "#89e051", CMake: "#DA3434",
};

type Bucket = "active" | "inactive" | "other";

type ApiRepo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  archived: boolean;
  fork: boolean;
};

type Repo = ApiRepo & { bucket: Bucket; ago: string };

function timeAgo(dateStr: string, now: number) {
  const days = Math.floor((now - new Date(dateStr).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function classify(repo: ApiRepo, now: number): Bucket {
  if (!repo.description) return "other";
  const pushedMsAgo = now - new Date(repo.pushed_at).getTime();
  if (pushedMsAgo > SIX_MONTHS_MS) return "inactive";
  return "active";
}

function RepoCard({ repo }: { repo: Repo }) {
  return (
    <a className="repo-card" href={repo.html_url} target="_blank" rel="noopener noreferrer">
      <span className="repo-name">{repo.name}</span>
      {repo.description && <p className="repo-desc">{repo.description}</p>}
      <div className="repo-meta">
        {repo.language && (
          <span>
            <span className="lang-dot" style={{ background: LANG_COLORS[repo.language] || "#999" }} />
            {repo.language}
          </span>
        )}
        {repo.stargazers_count > 0 && <span>★ {repo.stargazers_count}</span>}
        <span>{repo.ago}</span>
      </div>
      {repo.bucket === "inactive" && <span className="inactive-flag">Inactive</span>}
    </a>
  );
}

export default function RepoList() {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
        return res.json() as Promise<ApiRepo[]>;
      })
      .then((data) => {
        const now = Date.now();
        setRepos(
          data
            .filter((r) => !r.fork && !r.archived && !EXCLUDE.has(r.name))
            .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
            .map((r) => ({ ...r, bucket: classify(r, now), ago: timeAgo(r.pushed_at, now) }))
        );
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error(err);
        setFailed(true);
      });
    return () => controller.abort();
  }, []);

  const counts = useMemo(() => {
    const c = { active: 0, inactive: 0, other: 0 };
    repos?.forEach((r) => c[r.bucket]++);
    return { ...c, all: c.active + c.inactive };
  }, [repos]);

  const tabs: TabItem[] = [
    { key: "all", label: "All", icon: <ListFilterIcon /> },
    { key: "active", label: "Active", icon: <ActivityIcon /> },
    { key: "inactive", label: "Inactive", icon: <ArchiveIcon /> },
    { key: "other", label: "Other", icon: <EllipsisIcon /> },
  ].map((t) => ({
    ...t,
    count: repos ? counts[t.key as keyof typeof counts] : undefined,
  }));

  const visible = useMemo(() => {
    if (!repos) return [];
    let list =
      tab === "all"
        ? repos.filter((r) => r.bucket === "active" || r.bucket === "inactive")
        : repos.filter((r) => r.bucket === tab);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [repos, tab, query]);

  let status = "Loading repositories from GitHub…";
  if (failed) {
    status = "Couldn't reach the GitHub API right now. Browse the repositories directly on GitHub.";
  } else if (repos) {
    status = `${repos.length} public ${repos.length === 1 ? "repository" : "repositories"}.`;
  }

  return (
    <>
      <div className="repo-controls">
        <Tabs id="repo-tabs" tabs={tabs} active={tab} onChange={setTab} />
        <input
          type="search"
          id="repo-search"
          className="search-input"
          placeholder="Search repositories…"
          aria-label="Search repositories"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <p id="repos-status">{status}</p>
      {repos && visible.length > 0 && (
        <div className="repo-grid" id="repos-grid">
          {visible.map((r) => (
            <RepoCard key={r.name} repo={r} />
          ))}
        </div>
      )}
      {repos && visible.length === 0 && (
        <p id="repos-empty" className="prose">
          No repositories match here.
        </p>
      )}
    </>
  );
}
