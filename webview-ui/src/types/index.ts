export type PackageEcosystem =
  | "npm"
  | "pypi"
  | "cargo"
  | "nuget"
  | "maven"
  | "rubygems"
  | "packagist"
  | "pub";

export type LibraryStatus =
  | "active"
  | "maintenance"
  | "deprecated"
  | "archived"
  | "inactive"
  | "unknown";

export interface Library {
  id: string;
  name: string;
  description: string;

  area?: string;
  category?: string;

  ecosystem: PackageEcosystem;
  packageName: string;

  status: LibraryStatus;

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

  compatibilityScore?: number;
  matchReason?: string;
  alternatives?: string[];
  source?: "curated" | "registry" | "search";
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface Area {
  id: string;
  name: string;
  count: number;
  categories: Category[];
}

export interface ProjectInfo {
  name: string;
  framework?: string;
  language?: string;
  architectureScore?: number;

  installedLibraries: Library[];
  suggestedLibraries: Library[];
}
