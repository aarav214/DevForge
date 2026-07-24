import { Library, PackageRegistryAdapter, SearchOptions } from "./types";
import { fetchUrl, fetchJson } from "./utils";

export class PypiAdapter implements PackageRegistryAdapter {
  readonly ecosystem = "pypi";

  private decodeHtml(str: string): string {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/");
  }

  async search(query: string, options?: SearchOptions): Promise<Library[]> {
    if (!query.trim()) return [];
    try {
      const url = `https://pypi.org/search/?q=${encodeURIComponent(query)}`;
      const html = await fetchUrl(url);
      const results: Library[] = [];

      // Match package snippet container from pypi search HTML
      const regex = /<a class="package-snippet" href="\/project\/([^/]+)\/">[\s\S]*?<span class="package-snippet__name">([^<]+)<\/span>[\s\S]*?<span class="package-snippet__version">([^<]+)<\/span>[\s\S]*?<p class="package-snippet__description">([\s\S]*?)<\/p>/g;
      
      let match;
      const limit = options?.limit || 20;
      while ((match = regex.exec(html)) !== null && results.length < limit) {
        const pkgName = match[1].trim();
        const version = match[3].trim();
        const description = this.decodeHtml(match[4].trim()).replace(/\s+/g, " ");

        results.push({
          id: pkgName,
          name: pkgName,
          description,
          ecosystem: this.ecosystem,
          packageName: pkgName,
          latestVersion: version,
          installed: false,
          source: "registry"
        });
      }

      return results;
    } catch (e) {
      console.error("PyPI search error:", e);
      return [];
    }
  }

  async getPackage(packageName: string): Promise<Library | null> {
    try {
      const url = `https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`;
      const data = await fetchJson(url);
      const info = data.info || {};

      const latestVersion = info.version;
      const releases = data.releases || {};
      const latestRelease = releases[latestVersion] || [];
      const uploadTime = latestRelease[0]?.upload_time_iso_8601;

      return {
        id: info.name || packageName,
        name: info.name || packageName,
        description: info.summary || "",
        ecosystem: this.ecosystem,
        packageName: info.name || packageName,
        latestVersion,
        lastUpdated: uploadTime ? new Date(uploadTime).toLocaleDateString() : undefined,
        homepage: info.home_page || info.project_urls?.Homepage,
        repository: info.project_urls?.Source || info.project_urls?.["Source Code"] || info.project_urls?.Repository,
        documentation: info.project_urls?.Documentation,
        license: info.license,
        installed: false,
        source: "registry"
      } as Library;
    } catch (e) {
      console.error(`PyPI getPackage error for ${packageName}:`, e);
      return null;
    }
  }

  getInstallCommand(packageName: string): string {
    return `python -m pip install ${packageName}`;
  }
}
