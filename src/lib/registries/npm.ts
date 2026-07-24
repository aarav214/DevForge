import { Library, PackageRegistryAdapter, SearchOptions } from "./types";
import { fetchJson } from "./utils";

export class NpmAdapter implements PackageRegistryAdapter {
  readonly ecosystem = "npm";

  async search(query: string, options?: SearchOptions): Promise<Library[]> {
    if (!query.trim()) return [];
    try {
      const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${options?.limit || 20}`;
      const data = await fetchJson(url);
      const objects = data.objects || [];

      return objects.map((obj: any) => {
        const pkg = obj.package || {};
        return {
          id: pkg.name,
          name: pkg.name,
          description: pkg.description || "",
          ecosystem: this.ecosystem,
          packageName: pkg.name,
          latestVersion: pkg.version,
          lastUpdated: pkg.date ? new Date(pkg.date).toLocaleDateString() : undefined,
          homepage: pkg.links?.homepage,
          repository: pkg.links?.repository,
          license: pkg.license,
          installed: false,
          source: "registry"
        } as Library;
      });
    } catch (e) {
      console.error("npm search error:", e);
      return [];
    }
  }

  async getPackage(packageName: string): Promise<Library | null> {
    try {
      // Scoped packages like @scope/name must escape the '/' as '%2F'
      const escapedName = packageName.startsWith("@")
        ? packageName.replace("/", "%2F")
        : encodeURIComponent(packageName);
      const url = `https://registry.npmjs.org/${escapedName}`;
      const data = await fetchJson(url);

      const latestVersion = data["dist-tags"]?.latest;
      const latestInfo = data.versions?.[latestVersion] || {};
      const time = data.time || {};
      const modifiedTime = time[latestVersion] || time.modified;

      const deprecated = latestInfo.deprecated !== undefined || data.deprecated !== undefined;
      const deprecationMessage = latestInfo.deprecated || data.deprecated;

      return {
        id: data.name,
        name: data.name,
        description: data.description || latestInfo.description || "",
        ecosystem: this.ecosystem,
        packageName: data.name,
        latestVersion,
        lastUpdated: modifiedTime ? new Date(modifiedTime).toLocaleDateString() : undefined,
        homepage: data.homepage || latestInfo.homepage,
        repository: typeof data.repository === "object" ? data.repository?.url : data.repository,
        license: data.license || latestInfo.license,
        deprecated,
        deprecationMessage,
        status: deprecated ? "deprecated" : "active",
        installed: false,
        source: "registry"
      } as Library;
    } catch (e) {
      console.error(`npm getPackage error for ${packageName}:`, e);
      return null;
    }
  }

  getInstallCommand(packageName: string): string {
    return `npm install ${packageName}`;
  }
}
