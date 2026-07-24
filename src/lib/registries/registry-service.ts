import { Library, PackageEcosystem, PackageRegistryAdapter, SearchOptions } from "./types";
import { NpmAdapter } from "./npm";
import { PypiAdapter } from "./pypi";
import { CargoAdapter } from "./cargo";
import { NugetAdapter } from "./nuget";
import { MavenAdapter } from "./maven";
import { RubygemsAdapter } from "./rubygems";
import { PackagistAdapter } from "./packagist";
import { PubAdapter } from "./pub";
import { RegistryCache } from "../cache/registry-cache";
import { fetchJson } from "./utils";

export class RegistryService {
  private adapters: Map<PackageEcosystem, PackageRegistryAdapter> = new Map();
  private cache: RegistryCache;

  constructor(workspaceRoot?: string) {
    this.cache = new RegistryCache(workspaceRoot);

    // Register all adapters
    this.registerAdapter(new NpmAdapter());
    this.registerAdapter(new PypiAdapter());
    this.registerAdapter(new CargoAdapter());
    this.registerAdapter(new NugetAdapter());
    this.registerAdapter(new MavenAdapter());
    this.registerAdapter(new RubygemsAdapter());
    this.registerAdapter(new PackagistAdapter());
    this.registerAdapter(new PubAdapter());
  }

  private registerAdapter(adapter: PackageRegistryAdapter) {
    this.adapters.set(adapter.ecosystem, adapter);
  }

  // Unified search aggregating matching registries
  async search(query: string, options: { ecosystems?: PackageEcosystem[]; limit?: number } = {}): Promise<Library[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const ecosystems = options.ecosystems && options.ecosystems.length > 0
      ? options.ecosystems
      : (Array.from(this.adapters.keys())); // search all registries by default

    const cacheKey = `search:${ecosystems.join(",")}:${cleanQuery}`;
    const cachedResults = this.cache.get<Library[]>(cacheKey);
    if (cachedResults) {
      return cachedResults;
    }

    const searchPromises = ecosystems.map(async (eco) => {
      const adapter = this.adapters.get(eco);
      if (!adapter) return [];
      try {
        // Fetch up to 10 results from each to prevent massive payloads
        return await adapter.search(cleanQuery, { limit: options.limit || 10 });
      } catch (err) {
        console.error(`Error searching registry ${eco}:`, err);
        return [];
      }
    });

    const settled = await Promise.allSettled(searchPromises);
    const resultsList: Library[] = [];

    settled.forEach((res) => {
      if (res.status === "fulfilled") {
        resultsList.push(...res.value);
      }
    });

    // Deduplicate and prioritize exact name match
    const seen = new Set<string>();
    const uniqueResults = resultsList.filter((lib) => {
      const key = `${lib.ecosystem}:${lib.packageName.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Ranking: exact package name match first
    uniqueResults.sort((a, b) => {
      const aLower = a.packageName.toLowerCase();
      const bLower = b.packageName.toLowerCase();
      const queryLower = cleanQuery.toLowerCase();

      const aExact = aLower === queryLower ? 1 : 0;
      const bExact = bLower === queryLower ? 1 : 0;

      if (aExact !== bExact) {
        return bExact - aExact; // exact matches first
      }

      // secondary sort by string length (shorter names closer to query first)
      return a.packageName.length - b.packageName.length;
    });

    // Cache search results for 10 minutes (600,000 ms)
    this.cache.set(cacheKey, uniqueResults, 600000);

    return uniqueResults;
  }

  // Exact package lookup with lazy GitHub enrichment and caching
  async getPackage(packageName: string, ecosystem: PackageEcosystem): Promise<Library | null> {
    const cacheKey = `package:${ecosystem}:${packageName}`;
    const cachedLib = this.cache.get<Library>(cacheKey);
    if (cachedLib) {
      return cachedLib;
    }

    const adapter = this.adapters.get(ecosystem);
    if (!adapter) return null;

    let library = await adapter.getPackage(packageName);
    if (!library) return null;

    // Set install command dynamically if not provided by adapter
    if (!library.installCommand) {
      library.installCommand = adapter.getInstallCommand(packageName);
    }

    // Lazy load and enrich with GitHub metadata
    if (library.repository) {
      library = await this.enrichWithGithub(library);
    }

    // Cache package details for 4 hours (14,400,000 ms)
    this.cache.set(cacheKey, library, 14400000);

    return library;
  }

  // Lazy GitHub metadata fetch helper
  private async enrichWithGithub(library: Library): Promise<Library> {
    const repoUrl = library.repository || "";
    const githubRegex = /github\.com\/([^/]+)\/([^/.]+)/;
    const match = repoUrl.match(githubRegex);

    if (!match) return library;

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");
    const cacheKey = `github:${owner}:${repo}`;

    // Check if GitHub stats are cached separately
    const cachedStats = this.cache.get<any>(cacheKey);
    if (cachedStats) {
      return { ...library, ...cachedStats };
    }

    try {
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const gitData = await fetchJson(apiUrl, {
        headers: {
          // GitHub API requires User-Agent
          "User-Agent": "DevForge-VSCode-Extension/1.0.0"
        },
        timeoutMs: 3000
      });

      const stats = {
        stars: gitData.stargazers_count,
        forks: gitData.forks_count,
        status: gitData.archived ? "archived" : library.status
      };

      // Cache GitHub stats for 4 hours
      this.cache.set(cacheKey, stats, 14400000);

      return {
        ...library,
        ...stats
      };
    } catch (e) {
      // Fail gracefully: do not crash if GitHub is down or rate limited
      console.warn(`GitHub enrichment failed for ${owner}/${repo}:`, e);
      return library;
    }
  }

  // Clear cache helper
  clearCache() {
    this.cache.clear();
  }
}
