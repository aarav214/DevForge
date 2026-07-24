import { Library, PackageRegistryAdapter, SearchOptions } from "./types";
import { fetchJson } from "./utils";

export class RubygemsAdapter implements PackageRegistryAdapter {
  readonly ecosystem = "rubygems";

  async search(query: string, options?: SearchOptions): Promise<Library[]> {
    if (!query.trim()) return [];
    try {
      const url = `https://rubygems.org/api/v1/search.json?query=${encodeURIComponent(query)}`;
      const gems = await fetchJson(url);
      if (!Array.isArray(gems)) return [];

      const limit = options?.limit || 20;
      return gems.slice(0, limit).map((gem: any) => {
        return {
          id: gem.name,
          name: gem.name,
          description: gem.info || "",
          ecosystem: this.ecosystem,
          packageName: gem.name,
          latestVersion: gem.version,
          homepage: gem.homepage_uri,
          repository: gem.source_code_uri,
          downloads: gem.downloads,
          license: gem.licenses?.join(", "),
          installed: false,
          source: "registry"
        } as Library;
      });
    } catch (e) {
      console.error("RubyGems search error:", e);
      return [];
    }
  }

  async getPackage(packageName: string): Promise<Library | null> {
    try {
      const url = `https://rubygems.org/api/v1/gems/${encodeURIComponent(packageName)}.json`;
      const gem = await fetchJson(url);
      if (!gem || gem.error) return null;

      return {
        id: gem.name,
        name: gem.name,
        description: gem.info || "",
        ecosystem: this.ecosystem,
        packageName: gem.name,
        latestVersion: gem.version,
        homepage: gem.homepage_uri,
        repository: gem.source_code_uri,
        downloads: gem.downloads,
        license: gem.licenses?.join(", "),
        installed: false,
        source: "registry"
      } as Library;
    } catch (e) {
      console.error(`RubyGems getPackage error for ${packageName}:`, e);
      return null;
    }
  }

  getInstallCommand(packageName: string): string {
    return `gem install ${packageName}`;
  }
}
