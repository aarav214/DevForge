import { Library, PackageRegistryAdapter, SearchOptions } from "./types";
import { fetchJson } from "./utils";

export class PubAdapter implements PackageRegistryAdapter {
  readonly ecosystem = "pub";

  async search(query: string, options?: SearchOptions): Promise<Library[]> {
    if (!query.trim()) return [];
    try {
      const searchUrl = `https://pub.dev/api/search?q=${encodeURIComponent(query)}`;
      const data = await fetchJson(searchUrl);
      const pkgObjects = data.packages || [];
      const limit = options?.limit || 10; // limit concurrent detail fetches to avoid rate limits
      
      const names = pkgObjects.map((p: any) => p.package).slice(0, limit);
      const results = await Promise.all(
        names.map((name: string) => this.getPackage(name))
      );

      return results.filter((lib): lib is Library => lib !== null);
    } catch (e) {
      console.error("pub.dev search error:", e);
      return [];
    }
  }

  async getPackage(packageName: string): Promise<Library | null> {
    try {
      const url = `https://pub.dev/api/packages/${encodeURIComponent(packageName)}`;
      const data = await fetchJson(url);
      if (!data || !data.latest) return null;

      const latest = data.latest || {};
      const pubspec = latest.pubspec || {};
      const version = latest.version;

      const isFlutter =
        pubspec.dependencies?.flutter !== undefined ||
        packageName.toLowerCase().includes("flutter") ||
        (pubspec.description && pubspec.description.toLowerCase().includes("flutter"));

      const installCommand = isFlutter
        ? `flutter pub add ${packageName}`
        : `dart pub add ${packageName}`;

      return {
        id: packageName,
        name: packageName,
        description: pubspec.description || "",
        ecosystem: this.ecosystem,
        packageName: packageName,
        latestVersion: version,
        lastUpdated: data.updated ? new Date(data.updated).toLocaleDateString() : undefined,
        homepage: pubspec.homepage,
        repository: pubspec.repository,
        documentation: pubspec.documentation,
        installed: false,
        installCommand,
        source: "registry"
      } as Library;
    } catch (e) {
      console.error(`pub.dev getPackage error for ${packageName}:`, e);
      return null;
    }
  }

  getInstallCommand(packageName: string): string {
    return `flutter pub add ${packageName}`; // Default fallback
  }
}
