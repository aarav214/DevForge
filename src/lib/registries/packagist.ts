import { Library, PackageRegistryAdapter, SearchOptions } from "./types";
import { fetchJson } from "./utils";

export class PackagistAdapter implements PackageRegistryAdapter {
  readonly ecosystem = "packagist";

  async search(query: string, options?: SearchOptions): Promise<Library[]> {
    if (!query.trim()) return [];
    try {
      const url = `https://packagist.org/search.json?q=${encodeURIComponent(query)}&per_page=${options?.limit || 20}`;
      const data = await fetchJson(url);
      const results = data.results || [];

      return results.map((res: any) => {
        return {
          id: res.name,
          name: res.name,
          description: res.description || "",
          ecosystem: this.ecosystem,
          packageName: res.name,
          homepage: res.url,
          downloads: res.downloads,
          installed: false,
          source: "registry"
        } as Library;
      });
    } catch (e) {
      console.error("Packagist search error:", e);
      return [];
    }
  }

  async getPackage(packageName: string): Promise<Library | null> {
    try {
      if (!packageName.includes("/")) return null; // Composer names must be vendor/package
      const url = `https://repo.packagist.org/p2/${packageName}.json`;
      const data = await fetchJson(url);
      
      const packagesList = data.packages?.[packageName] || [];
      if (packagesList.length === 0) return null;

      // Find first non-development version
      const latestRelease = packagesList.find((p: any) => !p.version.toLowerCase().includes("dev") && !p.version.includes("alpha") && !p.version.includes("beta")) || packagesList[0] || {};

      return {
        id: packageName,
        name: packageName,
        description: latestRelease.description || "",
        ecosystem: this.ecosystem,
        packageName: packageName,
        latestVersion: latestRelease.version,
        homepage: latestRelease.homepage,
        repository: latestRelease.source?.url,
        license: latestRelease.license?.join(", "),
        installed: false,
        source: "registry"
      } as Library;
    } catch (e) {
      console.error(`Packagist getPackage error for ${packageName}:`, e);
      return null;
    }
  }

  getInstallCommand(packageName: string): string {
    return `composer require ${packageName}`;
  }
}
