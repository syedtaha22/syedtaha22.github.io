/**
 * repos.js — pulls public, non-fork repositories from the GitHub REST API
 * and renders them as a searchable, tabbed card grid into #repos-grid.
 * No build step, no upkeep: push a new repo on GitHub and it shows up
 * here on next page load, sorted into the right tab automatically.
 *
 * Tabs:
 *   Active   — pushed to within the last 6 months, has a description
 *   Archived — last push more than 6 months ago (or GitHub-archived)
 *   Other    — no description set, regardless of activity
 *
 * Uses the unauthenticated API (60 req/hr per IP) — one call per page
 * view is well within limits for a personal site.
 */
(function () {
  const USERNAME = "syedtaha22";
  const EXCLUDE = new Set([]); // repo names to hide, if ever needed
  const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;

  const statusEl = document.getElementById("repos-status");
  const grid = document.getElementById("repos-grid");
  const emptyEl = document.getElementById("repos-empty");
  const searchInput = document.getElementById("repo-search");
  const tabButtons = document.querySelectorAll("#repo-tabs .tab");

  if (!grid) return;

  const langColors = {
    "C++": "#f34b7d", C: "#555555", Python: "#3572A5",
    JavaScript: "#f1e05a", TypeScript: "#3178c6", "Jupyter Notebook": "#DA5B0B",
    Assembly: "#6E4C13", HTML: "#e34c26", CSS: "#563d7c", Rust: "#dea584",
    Go: "#00ADD8", Shell: "#89e051", CMake: "#DA3434",
  };

  let allRepos = [];
  let currentTab = "all";
  let currentQuery = "";

  function timeAgo(dateStr) {
    const then = new Date(dateStr).getTime();
    const days = Math.floor((Date.now() - then) / 86400000);
    if (days < 1) return "today";
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }

  function classify(repo) {
    if (!repo.description) return "other";
    const pushedMsAgo = Date.now() - new Date(repo.pushed_at).getTime();
    if (repo.archived || pushedMsAgo > SIX_MONTHS_MS) return "archived";
    return "active";
  }

  function buildCard(repo) {
    const card = document.createElement("a");
    card.className = "repo-card";
    card.href = repo.html_url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const name = document.createElement("span");
    name.className = "repo-name";
    name.textContent = repo.name;

    const desc = document.createElement("p");
    desc.className = "repo-desc";
    desc.textContent = repo.description || "No description provided.";

    const meta = document.createElement("div");
    meta.className = "repo-meta";

    if (repo.language) {
      const langSpan = document.createElement("span");
      const dot = document.createElement("span");
      dot.className = "lang-dot";
      dot.style.background = langColors[repo.language] || "#999";
      langSpan.appendChild(dot);
      langSpan.appendChild(document.createTextNode(repo.language));
      meta.appendChild(langSpan);
    }

    if (repo.stargazers_count > 0) {
      const stars = document.createElement("span");
      stars.textContent = `★ ${repo.stargazers_count}`;
      meta.appendChild(stars);
    }

    const updated = document.createElement("span");
    updated.textContent = timeAgo(repo.pushed_at);
    meta.appendChild(updated);

    card.append(name, desc, meta);

    if (repo._bucket === "archived") {
      const flag = document.createElement("span");
      flag.className = "archived-flag";
      flag.textContent = "Archived";
      card.appendChild(flag);
    }

    return card;
  }

  function render() {
    grid.innerHTML = "";

    let visible;
    if (currentTab === "all") {
      visible = allRepos.filter((r) => r._bucket === "active" || r._bucket === "archived");
    } else {
      visible = allRepos.filter((r) => r._bucket === currentTab);
    }

    if (currentQuery) {
      const q = currentQuery.toLowerCase();
      visible = visible.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)
      );
    }

    if (visible.length === 0) {
      grid.hidden = true;
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;
    grid.hidden = false;
    visible.forEach((r) => grid.appendChild(buildCard(r)));
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTab = btn.dataset.tab;
      tabButtons.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      render();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentQuery = e.target.value.trim();
      render();
    });
  }

  fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`, {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
      return res.json();
    })
    .then((repos) => {
      allRepos = repos
        .filter((r) => !r.fork && !EXCLUDE.has(r.name))
        .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        .map((r) => {
          r._bucket = classify(r);
          return r;
        });

      const counts = { active: 0, archived: 0, other: 0 };
      allRepos.forEach((r) => counts[r._bucket]++);
      counts.all = counts.active + counts.archived;
      tabButtons.forEach((btn) => {
        const key = btn.dataset.tab;
        btn.textContent = `${btn.textContent.replace(/\s*\(\d+\)$/, "")} (${counts[key]})`;
      });
      const tabsContainer = document.getElementById("repo-tabs");
      if (tabsContainer && tabsContainer._refreshTabIndicator) {
        tabsContainer._refreshTabIndicator();
      }

      statusEl.textContent = `${allRepos.length} public ${allRepos.length === 1 ? "repository" : "repositories"}.`;
      render();
    })
    .catch((err) => {
      statusEl.textContent = "Couldn't reach the GitHub API right now — browse the repositories directly on GitHub.";
      console.error(err);
    });
})();
