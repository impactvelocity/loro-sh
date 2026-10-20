/**
 * Themes are CSS files in themes/, each setting the design tokens for one
 * :root[data-theme="name"] scope. They're written in code, so the admin
 * only reads them: every file with a data-theme selector appears here.
 */

export type Theme = {
  name: string;
  file: string;
  /** The comment at the top of the file. */
  description: string;
  scheme: "light" | "dark";
  /** Custom properties as written, e.g. { "--primary": "oklch(...)" }. */
  tokens: Record<string, string>;
};

const sources = import.meta.glob<string>("../themes/*.css", {
  query: "?raw",
  import: "default",
  eager: true,
});

function parse(path: string, css: string): Theme | null {
  const name = css.match(/\[data-theme="([\w-]+)"\]\s*\{/)?.[1];
  if (!name) return null;
  const tokens = Object.fromEntries(
    [...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim()]),
  );
  return {
    name,
    file: path.replace("../", ""),
    description: css.match(/^\s*\/\*([\s\S]*?)\*\//)?.[1].replace(/\s*\n\s*\*?\s*/g, " ").trim() ?? "",
    scheme: /color-scheme:\s*dark/.test(css) ? "dark" : "light",
    tokens,
  };
}

const themes = Object.entries(sources)
  .map(([path, css]) => parse(path, css))
  .filter((theme): theme is Theme => theme !== null)
  .sort((a, b) => a.name.localeCompare(b.name));

export function listThemes() {
  return themes;
}
