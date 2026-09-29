"""
generate-sites.py
=================
Static site generator for the /blog section.

Reads data.json and generates one .html file per post plus a rendered
index.html. All page templates are defined in this script — no external
template files needed.

Post content is fetched and rendered client-side by marked.js. Everything
else (title, meta tags, OG tags, canonical URL, tags, author, date) is
pre-baked into the HTML at generation time.

Usage
-----
    python generate-sites.py              # generate all
    python generate-sites.py --clean      # delete generated files, then generate
    python generate-sites.py --list       # list posts from data.json and exit
    python generate-sites.py --post riscv-env-setup   # regenerate one post by slug
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path


BASE_DIR      = Path(__file__).parent
DATA_FILE     = BASE_DIR / "data.json"
POSTS_DIR     = BASE_DIR / "posts"
SITE_BASE_URL = "https://syedtaha.dev"

COMMON_HEAD = """\
    <meta charset="utf-8" />
    <script>
      (function () {
        try {
          var pref = localStorage.getItem("theme-preference") || "system";
          var dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
          document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        } catch (e) {}
      })();
    </script>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="author" content="Syed Taha">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdn.jsdelivr.net">

    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/style.css" />
    <script defer src="/assets/js/theme.js"></script>

    <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.webp">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.webp">
    <link rel="apple-touch-icon" href="/favicons/apple-touch-icon.webp">"""

NAV_HTML = """\
    <nav class="site-nav" id="site-nav" aria-label="Primary">
        <span class="nav-indicator" aria-hidden="true"></span>
        <a href="/">Home</a>
        <a href="/projects.html">Projects</a>
        <a href="/blog/" aria-current="page">Blog</a>
    </nav>"""

FOOTER_HTML = """\
    <footer class="site-footer">
        <div class="wrap">
            &copy; 2026 Syed Taha. Built with plain HTML, CSS, and JS —
            <a href="https://github.com/syedtaha22/personal-website">source</a>.
        </div>
    </footer>"""

THEME_SWITCHER_HTML = """\
    <div class="theme-switcher" id="theme-switcher">
        <button class="theme-trigger" id="theme-trigger" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Change theme"><span class="swatch" aria-hidden="true"></span></button>
        <div class="theme-menu" id="theme-menu" role="menu" hidden>
            <button class="theme-option" type="button" data-theme-choice="light" role="menuitem">Light</button>
            <button class="theme-option" type="button" data-theme-choice="dark" role="menuitem">Dark</button>
            <button class="theme-option" type="button" data-theme-choice="system" role="menuitem">System</button>
        </div>
    </div>"""


def _h(value: str) -> str:
    """Escape a string for safe injection into HTML text content."""
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _ha(value: str) -> str:
    """Escape a string for safe injection into an HTML attribute value."""
    return value.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


class Post:
    """Represents a single post loaded from data.json."""

    def __init__(self, data: dict):
        self.id             = data["id"]
        self.title          = data["title"]
        self.date           = data["date"]
        self.category       = data["category"]
        self.tags           = data["tags"]
        self.excerpt        = data["excerpt"]
        self.filename       = data["filename"]
        self.author         = data["author"]
        self.read_time      = data["readTime"]
        self.featured_image = data.get("featured_image")

        stem       = Path(self.filename).stem
        self.slug  = re.sub(r"^\d+-", "", stem)

    @property
    def url(self) -> str:
        return f"{SITE_BASE_URL}/blog/{self.slug}.html"

    @property
    def formatted_date(self) -> str:
        try:
            dt = datetime.strptime(self.date, "%Y-%m-%d")
            return f"{dt.strftime('%B')} {dt.day}, {dt.year}"
        except ValueError:
            return self.date

    @property
    def og_image(self) -> str:
        if self.featured_image:
            return f"{SITE_BASE_URL}/blog/{self.featured_image}"
        return f"{SITE_BASE_URL}/images/note-preview-ph.webp"

    @property
    def keywords(self) -> str:
        return ", ".join(self.tags)

    @property
    def tags_html(self) -> str:
        return "".join(f'<span class="tag">{_h(t)}</span>' for t in self.tags)

    @property
    def featured_image_html(self) -> str:
        if not self.featured_image:
            return ""
        return (
            f'<a href="#" class="image fit">'
            f'<img src="/blog/{_ha(self.featured_image)}" alt="{_ha(self.title)}" />'
            f'</a>'
        )

    def card_html(self) -> str:
        post_url = f"/blog/{self.slug}.html"
        return f"""
            <a class="post-card" href="{post_url}">
                <h3>{_h(self.title)}</h3>
                <div class="meta">
                    <span>{self.formatted_date}</span>
                    <span>{_h(self.category)}</span>
                    <span>{self.read_time} min read</span>
                </div>
                <p>{_h(self.excerpt)}</p>
                <span class="read-more">Read More</span>
            </a>"""


class Generator:
    def __init__(self, posts: list):
        self.posts = posts

    def _write(self, path: Path, content: str) -> None:
        path.write_text(content, encoding="utf-8")
        print(f"  wrote: {path.relative_to(BASE_DIR.parent)}")

    def build_all(self) -> None:
        print(f"Generating {len(self.posts)} post page(s)...\n")
        for post in self.posts:
            self._write(BASE_DIR / f"{post.slug}.html", self._post_html(post))
        print()
        self._write(BASE_DIR / "index.html", self._index_html())
        print(f"\nDone. {len(self.posts)} post(s) + index generated.")

    def build_post(self, slug: str) -> None:
        match = next((p for p in self.posts if p.slug == slug), None)
        if not match:
            available = ", ".join(p.slug for p in self.posts)
            sys.exit(f"ERROR: no post with slug '{slug}'. Available: {available}")
        self._write(BASE_DIR / f"{match.slug}.html", self._post_html(match))

    def clean(self) -> None:
        targets = [BASE_DIR / "index.html"] + [
            BASE_DIR / f"{p.slug}.html" for p in self.posts
        ]
        removed = 0
        for path in targets:
            if path.exists():
                path.unlink()
                print(f"  deleted: {path.name}")
                removed += 1
        if removed == 0:
            print("Nothing to clean.")

    def _post_html(self, post: Post) -> str:
        return f"""<!DOCTYPE html>
<html lang="en">

<head>
{COMMON_HEAD}

    <title>{_h(post.title)} - Syed Taha</title>
    <meta name="description" content="{_ha(post.excerpt)}">
    <meta name="keywords" content="{_ha(post.keywords)}">
    <link rel="canonical" href="{post.url}">

    <meta property="og:type"        content="article" />
    <meta property="og:title"       content="{_ha(post.title)}" />
    <meta property="og:description" content="{_ha(post.excerpt)}" />
    <meta property="og:image"       content="{_ha(post.og_image)}" />
    <meta property="og:url"         content="{_ha(post.url)}" />
</head>

<body>
{NAV_HTML}

    <main class="wrap">
        <header class="post-header blog-header">
            <h1 style="font-size: clamp(1.9rem, 4vw, 2.5rem);">{_h(post.title)}</h1>
            <p style="color: var(--ink-soft);">{_h(post.excerpt)}</p>
            <div class="meta">
                <span>{_h(post.author)}</span>
                <span>{post.formatted_date}</span>
                <span>{_h(post.category)}</span>
                <span>{post.read_time} min read</span>
            </div>
            <div class="post-tags">{post.tags_html}</div>
            <hr class="blog-rule" />
        </header>

        <div class="post-single-layout">
            <div>
                <div id="featured-image-container">{post.featured_image_html}</div>
                <article id="post-content"></article>
            </div>
            <aside>
                <div id="toc-sidebar">
                    <div id="toc-title">On this page</div>
                    <div id="toc-content"></div>
                </div>
            </aside>
        </div>
    </main>

{FOOTER_HTML}

{THEME_SWITCHER_HTML}

    <script defer src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script defer src="js/post.js" data-filename="{post.filename}"></script>
    <script defer src="/assets/js/terrain-bg.js"></script>
    <script defer src="/assets/js/nav-indicator.js"></script>

</body>

</html>
"""

    def _index_html(self) -> str:
        sorted_posts = sorted(self.posts, key=lambda p: p.date, reverse=True)
        cards = "".join(p.card_html() for p in sorted_posts)

        return f"""<!DOCTYPE html>
<html lang="en">

<head>
{COMMON_HEAD}

    <title>Blog - Syed Taha</title>
    <meta name="description" content="Notes on systems programming, machine learning, and low-level computing, by Syed Taha.">
    <meta name="keywords" content="Syed Taha, systems programming, RISC-V, machine learning, low-level computing, high-performance computing, technical writing, blog">
    <link rel="canonical" href="{SITE_BASE_URL}/blog/">
</head>

<body>
{NAV_HTML}

    <main class="wrap">
        <header class="blog-header">
            <h1 style="font-size: clamp(2rem, 4vw, 2.6rem);">Blog</h1>
            <p class="prose" style="margin: 0 auto;">Things I've built, learned, or figured out along the way.</p>
            <hr class="blog-rule" />
        </header>

        <div class="blog-layout">
            <aside class="col-side">
                <div class="sidebar-widget">
                    <h4>Featured</h4>
                    <div id="featured-posts"></div>
                </div>
                <div class="sidebar-widget">
                    <h4>Tags</h4>
                    <div class="tag-cloud" id="tags-cloud"></div>
                </div>
            </aside>

            <div class="col-main">
                <div class="blog-controls">
                    <div class="tabs" id="category-tabs" role="tablist">
                        <button class="tab is-active" data-category="all" role="tab" aria-selected="true">All</button>
                    </div>
                    <input type="search" id="post-search" class="search-input" placeholder="Search posts…" aria-label="Search posts" />
                </div>

                <div id="posts-container">{cards}
                </div>
                <p id="posts-empty" class="prose" hidden>No posts match here.</p>

                <div id="pagination">
                    <button id="prev-btn" disabled>&larr; Previous</button>
                    <span id="page-info"></span>
                    <button id="next-btn">Next &rarr;</button>
                </div>
            </div>
        </div>
    </main>

{FOOTER_HTML}

{THEME_SWITCHER_HTML}

    <script defer src="js/index.js"></script>
    <script defer src="/assets/js/terrain-bg.js"></script>
    <script defer src="/assets/js/nav-indicator.js"></script>
    <script defer src="/assets/js/tabs-indicator.js"></script>

</body>

</html>
"""


class SiteData:
    def __init__(self, path: Path):
        if not path.exists():
            sys.exit(f"ERROR: data.json not found at {path}")
        try:
            with path.open(encoding="utf-8") as f:
                raw = json.load(f)
        except json.JSONDecodeError as e:
            sys.exit(f"ERROR: data.json is not valid JSON: {e}")
        self.posts = [Post(p) for p in raw["posts"]]


def build_cli() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Static site generator for the /blog section.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python generate-sites.py                        # generate all\n"
            "  python generate-sites.py --clean                # delete generated files\n"
            "  python generate-sites.py --list                 # list posts and exit\n"
            "  python generate-sites.py --post riscv-env-setup # one post only\n"
        ),
    )
    parser.add_argument("--clean", action="store_true", help="Delete previously generated files and exit.")
    parser.add_argument("--list", action="store_true", help="Print all posts from data.json and exit without generating.")
    parser.add_argument("--post", metavar="SLUG", help="Regenerate only the post with this slug (e.g. riscv-env-setup).")
    return parser


def main() -> None:
    args = build_cli().parse_args()
    data = SiteData(DATA_FILE)
    gen  = Generator(data.posts)

    if args.list:
        print(f"{'ID':<4} {'Slug':<40} {'Date':<14} Title")
        print("-" * 90)
        for p in sorted(data.posts, key=lambda p: p.date, reverse=True):
            print(f"{p.id:<4} {p.slug:<40} {p.date:<14} {p.title}")
        return

    if args.clean:
        print("Cleaning previously generated files...")
        gen.clean()
        return

    if args.post:
        gen.build_post(slug=args.post)
    else:
        gen.build_all()


if __name__ == "__main__":
    main()
