export type PackageEcosystem =
  | "npm"
  | "pypi"
  | "cargo"
  | "nuget"
  | "maven"
  | "rubygems"
  | "packagist"
  | "pub";

export interface Library {
  id: string; // Dynamic identifier (e.g. packageName or custom coordinates)
  name: string;
  description?: string;

  area?: string;
  category?: string;

  ecosystem: PackageEcosystem;
  packageName: string;

  status?: "active" | "maintenance" | "deprecated" | "unknown";

  latestVersion?: string;
  lastUpdated?: string;
  releaseDate?: string;

  homepage?: string;
  repository?: string;
  documentation?: string;

  license?: string;

  deprecated?: boolean;
  deprecationMessage?: string;
  replacement?: string;

  installCommand?: string;

  downloads?: number;
  stars?: number;

  installed: boolean;
  installedVersion?: string;

  source?: "curated" | "registry" | "search";
}

export interface SearchOptions {
  limit?: number;
}

export interface PackageRegistryAdapter {
  ecosystem: PackageEcosystem;

  search(query: string, options?: SearchOptions): Promise<Library[]>;
  getPackage(packageName: string): Promise<Library | null>;
  getVersions?(packageName: string): Promise<string[]>;
  getInstallCommand(packageName: string): string;
}
