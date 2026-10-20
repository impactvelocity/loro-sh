import type { Catalogue } from "./define";

// Every folder in catalogues/ with an index.ts registers itself.
const modules = import.meta.glob<{ default: Catalogue }>("../../catalogues/*/index.ts", { eager: true });

const catalogues = new Map(Object.values(modules).map(({ default: catalogue }) => [catalogue.id, catalogue]));

export function listCatalogues(): Catalogue[] {
  return [...catalogues.values()];
}

export function getCatalogue(id: string): Catalogue | undefined {
  return catalogues.get(id);
}
