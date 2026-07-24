import { Library, PackageRegistryAdapter, SearchOptions } from "./types";
import { fetchJson } from "./utils";

export class CargoAdapter implements PackageRegistryAdapter {
  readonly ecosystem = "cargo";

  async search(query: string, options?: SearchOptions): Promise<Library[]> {
    if (!query.trim()) return [];
    try {
      const url = `https://crates.io/api/v1/crates?q=${encodeURIComponent(query)}&per_page=${options?.limit || 20}`;
      const data = await fetchJson(url);
      const crates = data.crates || [];

      return crates.map((c: any) => {
        return {
          id: c.id,
          name: c.name,
          description: c.description || "",
          ecosystem: this.ecosystem,
          packageName: c.id,
          latestVersion: c.max_version,
          lastUpdated: c.updated_at ? new Date(c.updated_at).toLocaleDateString() : undefined,
          homepage: c.homepage,
          repository: c.repository,
          documentation: c.documentation,
          downloads: c.downloads,
          license: c.license,
          installed: false,
          source: "registry"
        } as Library;
      });
    } catch (e) {
      console.error("crates.io search error:", e);
      return [];
    }
  }

  async getPackage(packageName: string): Promise<Library | null> {
    try {
      const url = `https://crates.io/api/v1/crates/${encodeURIComponent(packageName)}`;
      const data = await fetchJson(url);
      const c = data.crate;
      if (!c) return null;

      return {
        id: c.id,
        name: c.name,
        description: c.description || "",
        ecosystem: this.ecosystem,
        packageName: c.id,
        latestVersion: c.max_version,
        lastUpdated: c.updated_at ? new Date(c.updated_at).toLocaleDateString() : undefined,
        homepage: c.homepage,
        repository: c.repository,
        documentation: c.documentation,
        downloads: c.downloads,
        license: c.license,
        installed: false,
        source: "registry"
      } as Library;
    } catch (e) {
      console.error(`crates.io getPackage error for ${packageName}:`, e);
      return null;
    }
  }

  getInstallCommand(packageName: string): string {
    return `cargo add ${packageName}`;
  }
}
