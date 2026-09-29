# [syedtaha22.github.io](https://syedtaha22.github.io)

Source for my personal website. Built with Next.js (App Router, static export) and plain CSS, hosted on GitHub Pages.

Three sections: an about page, a projects page, and a blog where I write about things I build and figure out.

## Layout

- `app/`: routes (`/`, `/projects`, `/blog`, `/blog/[slug]`) and `globals.css`
- `components/`: `Navbar`, `Tabs`, `ProjectCarousel`, `RepoList`, `BlogIndex`, and other UI
- `content/`: blog metadata (`posts.json`) and post bodies (`posts/*.md`)
- `lib/`: post loading, markdown rendering, project data, terrain background
- `public/`: images, favicons, CV PDF, and `robots.txt`

## Development

```
npm install
npm run dev      # http://localhost:3000
npm run build    # static site written to out/
```

## Adding a blog post

1. Add the markdown file to `content/posts/`.
2. Add an entry to `content/posts.json` (the slug is the filename minus its numeric prefix and extension).

## Deploying

Pushes to `main` build and publish `out/` through `.github/workflows/deploy.yml`. In the repo settings, Pages must use "GitHub Actions" as its source.
