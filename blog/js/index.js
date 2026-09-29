/**
 * @file index.js
 * @brief Sidebar widgets, category tabs, search, and pagination for the
 *        static blog index page.
 *
 * @details Post cards are pre-rendered into the HTML by generate-sites.py
 * for the default (unfiltered, page 1) view. This file:
 *
 *  - Builds category tabs from the post data ("All" + one per category)
 *  - Wires the search box, filtering by title/excerpt/category
 *  - Renders the Featured and Tags sidebar widgets
 *  - Drives prev/next pagination for the unfiltered view
 *
 * Whenever a tab or the search box is active, pagination is hidden and
 * the full matching set is shown — same pattern as the GitHub repo list
 * on the projects page.
 */

function postUrl(filename) {
    const slug = filename.replace(/\.md$/, '').replace(/^\d+-/, '');
    return `/blog/${slug}.html`;
}

class PostCard {
    static build(post) {
        const url = postUrl(post.filename);
        const date = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        return `
            <a class="post-card" href="${url}">
                <h3>${post.title}</h3>
                <div class="meta">
                    <span>${date}</span>
                    <span>${post.category}</span>
                    <span>${post.readTime} min read</span>
                </div>
                <p>${post.excerpt}</p>
                <span class="read-more">Read More</span>
            </a>`;
    }
}

class IndexPage {
    constructor(posts) {
        this.posts = posts;
        this.postsPerPage = 5;
        this.category = 'all';
        this.query = '';

        const urlParams = new URLSearchParams(window.location.search);
        this.currentPage = parseInt(urlParams.get('page')) || 1;

        this.container = document.getElementById('posts-container');
        this.emptyEl = document.getElementById('posts-empty');
        this.pagination = document.getElementById('pagination');

        this.renderFeatured();
        this.renderTags();
        this.renderCategoryTabs();
        this.wireSearch();
        this.renderPaginatedDefault();
    }

    /* ---------------------------------------------------------- tabs */

    renderCategoryTabs() {
        const tabsEl = document.getElementById('category-tabs');
        if (!tabsEl) return;

        const categories = [...new Set(this.posts.map(p => p.category))].sort();

        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'tab';
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', 'false');
            btn.dataset.category = category;
            btn.textContent = category;
            tabsEl.appendChild(btn);
        });

        tabsEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab');
            if (!btn || !tabsEl.contains(btn)) return;

            tabsEl.querySelectorAll('.tab').forEach(b => {
                b.classList.toggle('is-active', b === btn);
                b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
            });

            this.category = btn.dataset.category;
            this.applyFilters();
        });
    }

    wireSearch() {
        const input = document.getElementById('post-search');
        if (!input) return;
        input.addEventListener('input', (e) => {
            this.query = e.target.value.trim().toLowerCase();
            this.applyFilters();
        });
    }

    /* ----------------------------------------------------- filtering */

    applyFilters() {
        const isFiltering = this.category !== 'all' || this.query !== '';

        if (!isFiltering) {
            this.pagination.style.display = '';
            this.renderPaginatedDefault();
            return;
        }

        let filtered = this.posts;
        if (this.category !== 'all') {
            filtered = filtered.filter(p => p.category === this.category);
        }
        if (this.query) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(this.query) ||
                p.excerpt.toLowerCase().includes(this.query) ||
                p.tags.some(t => t.toLowerCase().includes(this.query))
            );
        }

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.pagination.style.display = 'none';
        this.renderList(filtered);
    }

    renderList(posts) {
        this.container.innerHTML = posts.map(p => PostCard.build(p)).join('');
        this.emptyEl.hidden = posts.length !== 0;
        this.container.hidden = posts.length === 0;
    }

    /* ---------------------------------------------------- pagination */

    renderPaginatedDefault() {
        const sorted = [...this.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
        const totalPages = Math.max(1, Math.ceil(sorted.length / this.postsPerPage));
        this.currentPage = Math.min(Math.max(1, this.currentPage), totalPages);

        const start = (this.currentPage - 1) * this.postsPerPage;
        const pageItems = sorted.slice(start, start + this.postsPerPage);
        this.renderList(pageItems);

        document.getElementById('page-info').textContent =
            `Page ${this.currentPage} of ${totalPages}`;

        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages;

        prevBtn.onclick = () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                window.location.href = `/blog/?page=${this.currentPage}`;
            }
        };
        nextBtn.onclick = () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                window.location.href = `/blog/?page=${this.currentPage}`;
            }
        };
    }

    /* ------------------------------------------------------ sidebar */

    renderFeatured() {
        const container = document.getElementById('featured-posts');
        if (!container) return;

        const featured = [...this.posts]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        container.innerHTML = featured.map(post => {
            const date = new Date(post.date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            return `
                <a class="featured-item" href="${postUrl(post.filename)}">
                    <span class="f-title">${post.title}</span>
                    <span class="f-date">${date}</span>
                </a>`;
        }).join('');
    }

    renderTags() {
        const container = document.getElementById('tags-cloud');
        if (!container) return;

        const counts = {};
        this.posts.forEach(post => {
            post.tags.forEach(tag => { counts[tag] = (counts[tag] || 0) + 1; });
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);

        container.innerHTML = sorted.map(([tag]) =>
            `<a href="#" class="tag" data-tag="${tag}">${tag}</a>`
        ).join('');

        container.addEventListener('click', (e) => {
            const el = e.target.closest('.tag');
            if (!el) return;
            e.preventDefault();
            const input = document.getElementById('post-search');
            if (input) {
                input.value = el.dataset.tag;
                this.query = el.dataset.tag.toLowerCase();
                this.applyFilters();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const response = await fetch('/blog/data.json');
        const data = await response.json();
        new IndexPage(data.posts);
    } catch (error) {
        console.error('index.js: failed to load data.json:', error);
    }
});
