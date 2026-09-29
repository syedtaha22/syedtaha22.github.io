import { Marked } from "marked";
import markedKatex from "marked-katex-extension";
import { getSingletonHighlighter, type BundledLanguage } from "shiki";

export type TocEntry = { id: string; text: string };

// `defaultColor: false` makes shiki emit --shiki-light / --shiki-dark CSS
// variables per token instead of baking in one theme's colors, so the
// site's light/dark toggle (the data-theme attribute) picks between them.
// See `pre.shiki` in globals.css.
const SHIKI_THEMES = { light: "github-light", dark: "github-dark" } as const;
const PLAINTEXT_LANG = "text";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function fenceLanguages(markdown: string) {
  const langs = new Set<string>();
  for (const match of markdown.matchAll(/^[ \t]*```[ \t]*([A-Za-z][\w+#-]*)/gm)) langs.add(match[1]);
  return [...langs];
}

/**
 * Renders markdown to HTML at build time, giving every heading an id and
 * collecting h1/h2 for a TOC. Code fences are highlighted with shiki and
 * `$inline$` / `$$block$$` math is rendered with KaTeX, so neither ships
 * any JavaScript to the browser.
 */
export async function renderMarkdown(source: string) {
  const highlighter = await getSingletonHighlighter({
    themes: Object.values(SHIKI_THEMES),
    langs: [],
  });

  // A fence language that isn't a real shiki grammar (a typo, say) falls
  // back to a plain block instead of failing the build.
  await Promise.all(
    fenceLanguages(source).map(async (lang) => {
      try {
        await highlighter.loadLanguage(lang as BundledLanguage);
      } catch {}
    })
  );

  const toc: TocEntry[] = [];
  const used = new Set<string>();

  // A malformed formula renders as an inline error instead of throwing.
  const marked = new Marked(markedKatex({ throwOnError: false }), {
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        const text = html.replace(/<[^>]*>/g, "");
        let id = slugify(text) || "section";
        for (let n = 2; used.has(id); n++) id = `${slugify(text) || "section"}-${n}`;
        used.add(id);
        if (depth <= 2) toc.push({ id, text });
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      code({ text, lang }) {
        const language = lang?.split(/\s+/)[0];
        const resolved =
          language && highlighter.getLoadedLanguages().includes(language)
            ? language
            : PLAINTEXT_LANG;
        return highlighter.codeToHtml(text, {
          lang: resolved,
          themes: SHIKI_THEMES,
          defaultColor: false,
        });
      },
    },
  });

  return { html: marked.parse(source, { async: false }), toc };
}
