import { Library, PackageRegistryAdapter, SearchOptions } from "./types";
import { fetchJson } from "./utils";

export class NugetAdapter implements PackageRegistryAdapter {
  readonly ecosystem = "nuget";

  async search(query: string, options?: SearchOptions): Promise<Library[]> {
    if (!query.trim()) return [];
    try {
      const url = `https://azuresearch-usnc.nuget.org/query?q=${encodeURIComponent(query)}&take=${options?.limit || 20}`;
      const data = await fetchJson(url);
      const items = data.data || [];

      return items.map((item: any) => {
        return {
          id: item.id,
          name: item.id,
          description: item.description || "",
          ecosystem: this.ecosystem,
          packageName: item.id,
          latestVersion: item.version,
          homepage: item.projectUrl,
          downloads: item.totalDownloads,
          license: item.licenseUrl,
          installed: false,
          source: "registry"
        } as Library;
      });
    } catch (e) {
      console.error("NuGet search error:", e);
      return [];
    }
  }

  async getPackage(packageName: string): Promise<Library | null> {
    try {
      const url = `https://azuresearch-usnc.nuget.org/query?q=packageid:${encodeURIComponent(packageName.toLowerCase())}`;
      const data = await fetchJson(url);
      const items = data.data || [];
      if (items.length === 0) return null;

      const item = items[0];
      return {
        id: item.id,
        name: item.id,
        description: item.description || "",
        ecosystem: this.ecosystem,
        packageName: item.id,
        latestVersion: item.version,
        homepage: item.projectUrl,
        downloads: item.totalDownloads,
        license: item.licenseUrl,
        installed: false,
        source: "registry"
      } as Library;
    } catch (e) {
      console.error(`NuGet getPackage error for ${packageName}:`, e);
      return null;
    }
  }

  getInstallCommand(packageName: string): string {
    return `dotnet add package ${packageName}`;
  }
}
