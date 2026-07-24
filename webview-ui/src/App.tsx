import { useState, useEffect } from "react";
import { Library, PackageEcosystem } from "./types";
import { AREAS, LIBRARIES } from "./full_library_catalog";
import { LibraryCard } from "./components/LibraryCard";
import { AiBox } from "./components/AiBox";
import { LoadingState } from "./components/LoadingState";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";
import { vscodeService } from "./services/vscode";

const ECOSYSTEMS: { id: PackageEcosystem | "all"; name: string }[] = [
  { id: "all", name: "All" },
  { id: "npm", name: "npm" },
  { id: "pypi", name: "PyPI" },
  { id: "cargo", name: "Cargo" },
  { id: "nuget", name: "NuGet" },
  { id: "maven", name: "Maven" },
  { id: "rubygems", name: "RubyGems" },
  { id: "packagist", name: "Composer" },
  { id: "pub", name: "pub.dev" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"all" | "project">("all");
  const [selectedEcosystem, setSelectedEcosystem] = useState<PackageEcosystem | "all">("all");
  
  // ALL tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [registryResults, setRegistryResults] = useState<Library[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({
    frontend: true
  });
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // Project state
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [rawProjectData, setRawProjectData] = useState<any>(null);
  const [installedLibraries, setInstalledLibraries] = useState<Library[]>([]);
  const [suggestedLibraries, setSuggestedLibraries] = useState<Library[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ summary: string; recommendations: Library[] } | null>(null);
  const [customQueryInFlight, setCustomQueryInFlight] = useState(false);

  // Install/Remove progress state
  const [pendingInstalls, setPendingInstalls] = useState<Record<string, boolean>>({});
  const [pendingRemoves, setPendingRemoves] = useState<Record<string, boolean>>({});
  const [installError, setInstallError] = useState<string | null>(null);

  // Scan project on mount
  useEffect(() => {
    setProjectLoading(true);
    vscodeService.requestProject();
  }, []);

  // Debounced live registry search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setRegistryResults([]);
      setRegistryLoading(false);
      return;
    }

    setRegistryLoading(true);
    const delayDebounce = setTimeout(() => {
      const ecosystems = selectedEcosystem === "all" ? [] : [selectedEcosystem];
      vscodeService.searchRegistry(searchQuery, ecosystems);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedEcosystem]);

  // Listen to messages from the VS Code Extension Host
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      switch (msg.command) {
        case "project.get.success":
          setProjectLoading(false);
          setProjectError(null);
          setRawProjectData(msg.data);
          processScannedProject(msg.data);
          
          // Trigger initial recommendations scan
          setSuggestedLoading(true);
          const stackInfo = [
            ...(msg.data.frameworks || []),
            ...(msg.data.languages || []),
            ...(msg.data.databases || []),
          ].join(", ");
          vscodeService.askAI(
            `Recommend exactly 3 libraries that match a project using: ${stackInfo}. Specify library name, purpose, reason and compatibility.`,
            "recommend"
          );
          break;

        case "project.get.error":
          setProjectLoading(false);
          setProjectError(msg.error || "Could not scan repository.");
          break;

        case "ai.ask.success": {
          setSuggestedLoading(false);
          const recList = msg.data?.recommendations || [];
          const mappedSuggestions = recList.map((item: any, idx: number) => {
            const libraryName = item.library || "";
            
            // Try to match curated library for exact registry properties
            const matchedCurated = LIBRARIES.find(
              (l) => l.name.toLowerCase() === libraryName.toLowerCase() ||
                     l.packageName.toLowerCase() === libraryName.toLowerCase()
            );

            let eco: PackageEcosystem = "npm";
            let realPackageName = libraryName;
            
            if (matchedCurated) {
              eco = matchedCurated.ecosystem;
              realPackageName = matchedCurated.packageName;
            } else {
              // Guess ecosystem based on project languages
              if (rawProjectData?.languages?.includes("Python")) eco = "pypi";
              else if (rawProjectData?.languages?.includes("Rust")) eco = "cargo";
              
              // Normalize npm names
              if (eco === "npm") {
                realPackageName = libraryName.toLowerCase().replace(/\s+/g, "-");
              }
            }

            const isInstalled = installedLibraries.some(
              (l) => l.packageName.toLowerCase() === realPackageName.toLowerCase()
            );

            let score = 0.96 - idx * 0.05;
            if (item.compatibility?.toLowerCase() === "warning") score = 0.65;

            return {
              id: realPackageName,
              name: libraryName,
              description: item.purpose,
              ecosystem: eco,
              packageName: realPackageName,
              status: item.compatibility?.toLowerCase() === "warning" ? "maintenance" : "active",
              compatibilityScore: score,
              installed: isInstalled,
              matchReason: item.reason,
              alternatives: item.alternatives || [],
            } as Library;
          });

          if (customQueryInFlight) {
            setAiResponse({
              summary: msg.data?.summary || "Here are some recommendations:",
              recommendations: mappedSuggestions
            });
            setCustomQueryInFlight(false);
          } else {
            setSuggestedLibraries(mappedSuggestions);
          }
          break;
        }

        case "ai.ask.error":
          setSuggestedLoading(false);
          setInstallError(msg.error || "AI recommendation query failed.");
          break;

        case "registry.search.success": {
          if (msg.query === searchQuery) {
            setRegistryLoading(false);
            const results = (msg.results || []).map((lib: any) => ({
              ...lib,
              installed: isLibraryInstalled(lib.packageName)
            }));
            setRegistryResults(results);
          }
          break;
        }

        case "registry.search.error":
          setRegistryLoading(false);
          setInstallError(msg.error || "Registry search failed.");
          break;

        case "registry.get.success": {
          const updatedLib = msg.library;
          if (updatedLib) {
            // Helper to update library details inside array
            const updateItem = (item: Library) =>
              item.packageName.toLowerCase() === updatedLib.packageName.toLowerCase() &&
              item.ecosystem === updatedLib.ecosystem
                ? { ...item, ...updatedLib, installed: isLibraryInstalled(item.packageName) }
                : item;

            setRegistryResults((prev) => prev.map(updateItem));
            setSuggestedLibraries((prev) => prev.map(updateItem));
            setInstalledLibraries((prev) =>
              prev.map((item) =>
                item.packageName.toLowerCase() === updatedLib.packageName.toLowerCase() &&
                item.ecosystem === updatedLib.ecosystem
                  ? { ...item, ...updatedLib, installed: true }
                  : item
              )
            );
          }
          break;
        }

        case "library.install.progress":
          setInstallError(null);
          break;

        case "library.install.success": {
          const libId = msg.libraryId;
          setPendingInstalls((prev) => ({ ...prev, [libId]: false }));
          setRawProjectData(msg.data);
          processScannedProject(msg.data);
          break;
        }

        case "library.install.error": {
          const libId = msg.libraryId;
          setPendingInstalls((prev) => ({ ...prev, [libId]: false }));
          setInstallError(msg.error || `Failed to install ${libId}`);
          break;
        }

        case "library.remove.progress":
          break;

        case "library.remove.success": {
          const libId = msg.libraryId;
          setPendingRemoves((prev) => ({ ...prev, [libId]: false }));
          setRawProjectData(msg.data);
          processScannedProject(msg.data);
          break;
        }

        case "library.remove.error": {
          const libId = msg.libraryId;
          setPendingRemoves((prev) => ({ ...prev, [libId]: false }));
          setInstallError(msg.error || `Failed to remove ${libId}`);
          break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [rawProjectData, searchQuery, customQueryInFlight, installedLibraries]);

  // Processes key_dependencies from /scan and merges it with mockData.ts
  const processScannedProject = (scanData: any) => {
    const deps = scanData.key_dependencies || {};
    const list: Library[] = [];

    Object.keys(deps).forEach((depName) => {
      const depNameLower = depName.toLowerCase();
      // Look up in mock database
      const foundMock = LIBRARIES.find((lib) => lib.packageName.toLowerCase() === depNameLower);

      // Guess ecosystem if not in mock database
      let guessedEco: PackageEcosystem = "npm";
      if (scanData.package_managers?.includes("pip") || scanData.languages?.includes("Python")) {
        guessedEco = "pypi";
      } else if (scanData.package_managers?.includes("cargo") || scanData.languages?.includes("Rust")) {
        guessedEco = "cargo";
      }

      if (foundMock) {
        list.push({
          ...foundMock,
          installed: true,
          installedVersion: deps[depName]
        });
      } else {
        list.push({
          id: depName,
          name: depName,
          description: "Project dependency.",
          ecosystem: guessedEco,
          packageName: depName,
          status: "active",
          installed: true,
          installedVersion: deps[depName]
        });
      }
    });

    setInstalledLibraries(list);
  };

  const handleInstall = (lib: Library) => {
    setPendingInstalls((prev) => ({ ...prev, [lib.packageName]: true }));
    vscodeService.installLibrary(lib.packageName, lib.ecosystem);
  };

  const handleRemove = (lib: Library) => {
    const confirm = window.confirm(`Are you sure you want to remove ${lib.packageName}?`);
    if (!confirm) return;

    setPendingRemoves((prev) => ({ ...prev, [lib.packageName]: true }));
    vscodeService.removeLibrary(lib.packageName, lib.ecosystem);
  };

  const handleSendAiQuery = (queryText: string) => {
    setSuggestedLoading(true);
    setInstallError(null);
    setCustomQueryInFlight(true);
    vscodeService.askAI(queryText, "recommend");
  };

  const handleExpandLibrary = (packageName: string, ecosystem: PackageEcosystem) => {
    vscodeService.getPackageDetails(packageName, ecosystem);
  };

  const toggleArea = (areaId: string) => {
    setExpandedAreas((prev) => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  // Check if a package is installed
  const isLibraryInstalled = (packageName: string) => {
    return installedLibraries.some(
      (lib) => lib.packageName.toLowerCase() === packageName.toLowerCase()
    );
  };

  // Check if an install or remove action is currently loading
  const isActionPending = (packageName: string) => {
    return !!pendingInstalls[packageName] || !!pendingRemoves[packageName];
  };

  // Health score calculation
  const calculateHealthScore = () => {
    let score = 95;
    installedLibraries.forEach((lib) => {
      if (lib.deprecated) {
        score -= 15;
      }
    });
    return Math.max(score, 20);
  };

  // Dynamic counts reflecting current ecosystem filter
  const getCategoryCount = (catId: string) => {
    return LIBRARIES.filter(
      (lib) =>
        lib.category === catId &&
        (selectedEcosystem === "all" || lib.ecosystem === selectedEcosystem)
    ).length;
  };

  const getAreaCount = (areaId: string) => {
    return LIBRARIES.filter(
      (lib) =>
        lib.area === areaId &&
        (selectedEcosystem === "all" || lib.ecosystem === selectedEcosystem)
    ).length;
  };

  // Category list page
  const renderCategoryPage = (categoryId: string) => {
    const category = AREAS.flatMap((a) => a.categories).find((c) => c.id === categoryId);
    const area = AREAS.find((a) => a.categories.some((c) => c.id === categoryId));
    if (!category || !area) return null;

    const catCount = getCategoryCount(categoryId);
    const filteredLibs = LIBRARIES.filter(
      (lib) =>
        lib.category === categoryId &&
        (selectedEcosystem === "all" || lib.ecosystem === selectedEcosystem) &&
        lib.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
    ).map((lib) => ({
      ...lib,
      installed: isLibraryInstalled(lib.packageName)
    }));

    return (
      <div className="category-page">
        <div className="category-page-header">
          <button className="back-button" onClick={() => setCurrentCategoryId(null)}>
            ‹ {area.name}
          </button>
          <h2 className="category-title">{category.name}</h2>
          <p className="category-subtitle">{catCount} libraries</p>
        </div>

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search category..."
            value={categorySearchQuery}
            onChange={(e) => setCategorySearchQuery(e.target.value)}
          />
        </div>

        {filteredLibs.length === 0 ? (
          <EmptyState message={`No libraries found matching "${categorySearchQuery}"`} />
        ) : (
          <div className="libraries-list">
            {filteredLibs.map((lib) => (
              <LibraryCard
                key={`${lib.ecosystem}:${lib.packageName}`}
                library={lib}
                context="marketplace"
                isInstalling={isActionPending(lib.packageName)}
                isRemoving={isActionPending(lib.packageName)}
                onInstall={() => handleInstall(lib)}
                onExpand={() => handleExpandLibrary(lib.packageName, lib.ecosystem)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Unified Curated + Registry Search
  const renderSearchAndMarketplace = () => {
    if (currentCategoryId) {
      return renderCategoryPage(currentCategoryId);
    }

    const localMatched = LIBRARIES.filter(
      (lib) =>
        (selectedEcosystem === "all" || lib.ecosystem === selectedEcosystem) &&
        (lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lib.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const mergedResults: Library[] = [];
    const seen = new Set<string>();

    // 1. Curated match first (ranks exact names higher)
    localMatched.forEach((curated) => {
      const live = registryResults.find(
        (r) => r.packageName.toLowerCase() === curated.packageName.toLowerCase() && r.ecosystem === curated.ecosystem
      );
      const merged = live ? { ...curated, ...live, source: "curated" as const } : { ...curated, source: "curated" as const };
      merged.installed = isLibraryInstalled(merged.packageName);
      mergedResults.push(merged);
      seen.add(`${merged.ecosystem}:${merged.packageName.toLowerCase()}`);
    });

    // 2. Registry match
    registryResults.forEach((live) => {
      const key = `${live.ecosystem}:${live.packageName.toLowerCase()}`;
      if (!seen.has(key)) {
        mergedResults.push({
          ...live,
          installed: isLibraryInstalled(live.packageName),
          source: "registry"
        });
        seen.add(key);
      }
    });

    if (searchQuery.trim() !== "") {
      return (
        <div>
          <div className="section-title">
            Search Results ({mergedResults.length}) {registryLoading && "..."}
          </div>
          {mergedResults.length === 0 && !registryLoading ? (
            <EmptyState message={`No packages found for "${searchQuery}"`} />
          ) : (
            <div className="libraries-list">
              {mergedResults.map((lib) => (
                <LibraryCard
                  key={`${lib.ecosystem}:${lib.packageName}`}
                  library={lib}
                  context="marketplace"
                  isInstalling={isActionPending(lib.packageName)}
                  onInstall={() => handleInstall(lib)}
                  onExpand={() => handleExpandLibrary(lib.packageName, lib.ecosystem)}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="areas-list">
        {AREAS.map((area) => {
          const isExpanded = !!expandedAreas[area.id];
          const areaCount = getAreaCount(area.id);
          return (
            <div key={area.id} className="area-item">
              <button className="area-header" onClick={() => toggleArea(area.id)}>
                <div className="area-title-container">
                  <span className={`area-chevron ${isExpanded ? "expanded" : ""}`}>
                    ▶
                  </span>
                  <span>{area.name}</span>
                </div>
                <span className="area-count">{areaCount}</span>
              </button>

              {isExpanded && (
                <div className="category-list">
                  {area.categories.map((cat) => {
                    const catCount = getCategoryCount(cat.id);
                    return (
                      <button
                        key={cat.id}
                        className="category-item"
                        onClick={() => {
                          setCurrentCategoryId(cat.id);
                          setCategorySearchQuery("");
                        }}
                      >
                        <span>{cat.name}</span>
                        <span className="category-arrow">{catCount} ›</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Rendering Helper for Project view
  const renderProjectPage = () => {
    if (projectLoading) {
      return <LoadingState message="Scanning project stack..." />;
    }

    const repoName = rawProjectData?.repository || "Active Project";
    const techStack = rawProjectData
      ? [
          rawProjectData.frameworks?.join(" • "),
          rawProjectData.languages?.join(" • "),
        ]
          .filter(Boolean)
          .join(" • ")
      : "Scan unavailable (using fallback context)";

    return (
      <div className="project-page">
        {projectError && (
          <div style={{ backgroundColor: "rgba(248, 81, 73, 0.1)", borderLeft: "3px solid var(--vscode-errorForeground, #f85149)", padding: "8px 12px", borderRadius: "4px", fontSize: "11px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <span>⚠️ {projectError}</span>
            <button 
              onClick={() => {
                setProjectLoading(true);
                setProjectError(null);
                vscodeService.requestProject();
              }}
              style={{ background: "none", border: "none", color: "var(--vscode-textLink-foreground)", cursor: "pointer", fontSize: "10px", fontWeight: "bold", whiteSpace: "nowrap" }}
            >
              Retry Scan
            </button>
          </div>
        )}

        <div className="project-meta-section">
          <h2 className="project-name">{repoName}</h2>
          <p className="project-tech">{techStack}</p>
          <div className="health-container">
            <span className="health-label">Architecture Health</span>
            <span className="health-score">{calculateHealthScore()}</span>
          </div>
        </div>

        <div className="section-title">
          Installed Libraries ({installedLibraries.length})
        </div>
        {installedLibraries.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--vscode-descriptionForeground)", padding: "8px 0" }}>
            No supported dependencies detected.
          </div>
        ) : (
          <div className="installed-list">
            {installedLibraries.map((lib) => (
              <LibraryCard
                key={`${lib.ecosystem}:${lib.packageName}`}
                library={lib}
                context="project-installed"
                isInstalling={isActionPending(lib.packageName)}
                isRemoving={isActionPending(lib.packageName)}
                onRemove={() => handleRemove(lib)}
                onExpand={() => handleExpandLibrary(lib.packageName, lib.ecosystem)}
              />
            ))}
          </div>
        )}

        <div className="section-title">✦ Suggested for this Project</div>
        {suggestedLoading ? (
          <LoadingState message="Finding libraries that fit..." />
        ) : suggestedLibraries.length === 0 ? (
          <EmptyState message="No suggestions yet. Tell AI what you're building." />
        ) : (
          <div className="suggested-list">
            {suggestedLibraries.map((lib) => (
              <LibraryCard
                key={`${lib.ecosystem}:${lib.packageName}`}
                library={{
                  ...lib,
                  installed: isLibraryInstalled(lib.packageName)
                }}
                context="project-suggested"
                isInstalling={isActionPending(lib.packageName)}
                onInstall={() => handleInstall(lib)}
                onExpand={() => handleExpandLibrary(lib.packageName, lib.ecosystem)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <header className="devforge-header">
        <div className="brand">
          <span className="brand-icon">◈</span>
          <span>DevForge</span>
        </div>
        <div className="tabs">
          <button
            className={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
          </button>
          <button
            className={`tab ${activeTab === "project" ? "active" : ""}`}
            onClick={() => setActiveTab("project")}
          >
            Project
          </button>
        </div>
      </header>

      {/* Ecosystem filter pills */}
      {activeTab === "all" && !currentCategoryId && (
        <div className="ecosystem-filter-bar" style={{ display: "flex", gap: "6px", overflowX: "auto", padding: "4px 16px", backgroundColor: "var(--vscode-sideBar-background)", borderBottom: "1px solid var(--vscode-panel-border, #303030)" }}>
          {ECOSYSTEMS.map((eco) => (
            <button
              key={eco.id}
              onClick={() => setSelectedEcosystem(eco.id)}
              style={{
                fontSize: "10px",
                padding: "3px 8px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                backgroundColor: selectedEcosystem === eco.id ? "var(--vscode-button-background, #007acc)" : "var(--vscode-button-secondaryBackground, #3a3d41)",
                color: selectedEcosystem === eco.id ? "var(--vscode-button-foreground, #ffffff)" : "var(--vscode-button-secondaryForeground, #cccccc)"
              }}
            >
              {eco.name}
            </button>
          ))}
        </div>
      )}

      <main className="content-area">
        {activeTab === "all" && !currentCategoryId && (
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search registries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {installError && (
          <ErrorState
            message={installError}
            retryLabel="Dismiss"
            onRetry={() => setInstallError(null)}
          />
        )}
        
        {activeTab === "all" ? renderSearchAndMarketplace() : renderProjectPage()}
      </main>

      <AiBox
        loading={suggestedLoading}
        onSendQuery={handleSendAiQuery}
        response={aiResponse}
        onInstallLibrary={handleInstall}
        isActionPending={isActionPending}
      />
    </>
  );
}
