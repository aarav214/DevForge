import React, { useState } from "react";
import { Library } from "../types";
import { StatusBadge } from "./StatusBadge";

interface LibraryCardProps {
  library: Library;
  context: "marketplace" | "project-installed" | "project-suggested" | "ai-recommendation";
  isInstalling?: boolean;
  isRemoving?: boolean;
  onInstall?: () => void;
  onRemove?: () => void;
  onExpand?: () => void; // Trigger callback on expand to fetch details from registry
}

export const LibraryCard: React.FC<LibraryCardProps> = ({
  library,
  context,
  isInstalling = false,
  isRemoving = false,
  onInstall,
  onRemove,
  onExpand,
}) => {
  const isCollapsible = context === "project-suggested" || context === "ai-recommendation" || context === "marketplace";
  const [expanded, setExpanded] = useState(!isCollapsible);

  const showInstall = !library.installed && context !== "project-installed";
  const showRemove = library.installed && context === "project-installed";
  const showInstalledLabel = library.installed;

  const handleHeaderClick = () => {
    if (isCollapsible) {
      const nextExpanded = !expanded;
      setExpanded(nextExpanded);
      if (nextExpanded && onExpand) {
        onExpand();
      }
    }
  };

  const getEcosystemLabel = (eco: string) => {
    switch (eco) {
      case "pypi": return "PyPI";
      case "cargo": return "crates.io";
      case "nuget": return "NuGet";
      case "maven": return "Maven";
      case "rubygems": return "RubyGems";
      case "packagist": return "Composer";
      case "pub": return "pub.dev";
      default: return eco;
    }
  };

  return (
    <div className="library-card" style={{ cursor: isCollapsible ? "pointer" : "default" }}>
      <div 
        className="library-card-header" 
        onClick={handleHeaderClick}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isCollapsible && (
            <span style={{ fontSize: "10px", color: "var(--vscode-descriptionForeground)", transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s ease", display: "inline-block" }}>
              ▼
            </span>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span className="library-name">{library.name}</span>
            <span style={{ fontSize: "10px", color: "var(--vscode-descriptionForeground)" }}>
              {getEcosystemLabel(library.ecosystem)}
            </span>
          </div>
        </div>
        
        {library.compatibilityScore !== undefined && context !== "ai-recommendation" && (
          <span className="compatibility-score">
            {Math.round(library.compatibilityScore * 100)}% match
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px", borderTop: isCollapsible ? "1px solid var(--vscode-panel-border, #303030)" : "none", paddingTop: isCollapsible ? "6px" : "0" }}>
          {library.description && <p className="library-description">{library.description}</p>}

          {/* GitHub and Registry Metrics */}
          {(library.stars !== undefined || library.downloads !== undefined || library.license) && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "10px", color: "var(--vscode-descriptionForeground)" }}>
              {library.stars !== undefined && library.stars > 0 && (
                <span>⭐ {library.stars.toLocaleString()}</span>
              )}
              {library.downloads !== undefined && library.downloads > 0 && (
                <span>📥 {library.downloads.toLocaleString()}</span>
              )}
              {library.license && (
                <span>⚖️ {library.license}</span>
              )}
            </div>
          )}

          {library.matchReason && (
            <div style={{ fontSize: "11px", color: "var(--vscode-foreground)", backgroundColor: "rgba(255,255,255,0.03)", padding: "4px 6px", borderRadius: "3px", borderLeft: "2px solid var(--vscode-textLink-foreground)" }}>
              <span style={{ color: "var(--vscode-descriptionForeground)", fontWeight: 600 }}>Why it matches:</span> {library.matchReason}
            </div>
          )}

          {library.alternatives && library.alternatives.length > 0 && (
            <div style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)" }}>
              <span>Alternatives: </span>
              <span style={{ fontStyle: "italic" }}>{library.alternatives.join(", ")}</span>
            </div>
          )}

          {library.deprecated && (
            <div className="deprecation-warning" style={{ backgroundColor: "rgba(255, 165, 0, 0.1)", borderLeft: "3px solid orange", padding: "4px 8px", borderRadius: "3px", fontSize: "11px" }}>
              <span>⚠️ Deprecated</span>
              {library.deprecationMessage && <span style={{ display: "block", fontSize: "10px", marginTop: "2px" }}>{library.deprecationMessage}</span>}
              {library.replacement && (
                <span className="replacement-text">
                  {" "}
                  Replacement: <strong>{library.replacement}</strong>
                </span>
              )}
            </div>
          )}

          {/* Install command block */}
          {library.installCommand && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "9px", color: "var(--vscode-descriptionForeground)", fontWeight: 600 }}>INSTALLATION</span>
              <div style={{ position: "relative", backgroundColor: "var(--vscode-textCodeBlock-background, rgba(0,0,0,0.2))", padding: "6px", borderRadius: "3px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <code style={{ fontSize: "10px", color: "var(--vscode-textLink-activeForeground, #e0e0e0)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {library.installCommand}
                </code>
                <button
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "var(--vscode-textLink-foreground)",
                    cursor: "pointer",
                    fontSize: "9px",
                    padding: "2px 4px"
                  }}
                  title="Copy command"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(library.installCommand || "");
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="library-meta" style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "10px" }}>
            {library.status && <StatusBadge status={library.status} />}
            {library.lastUpdated && (
              <span className="meta-updated" style={{ color: "var(--vscode-descriptionForeground)" }}>
                • Updated {library.lastUpdated}
              </span>
            )}
          </div>

          {/* External links */}
          {(library.homepage || library.repository || library.documentation) && (
            <div style={{ display: "flex", gap: "8px", fontSize: "10px", marginTop: "2px" }}>
              {library.homepage && (
                <a href={library.homepage} target="_blank" rel="noopener noreferrer" style={{ color: "var(--vscode-textLink-foreground)", textDecoration: "none" }}>
                  Homepage
                </a>
              )}
              {library.repository && (
                <a href={library.repository} target="_blank" rel="noopener noreferrer" style={{ color: "var(--vscode-textLink-foreground)", textDecoration: "none" }}>
                  Repository
                </a>
              )}
              {library.documentation && (
                <a href={library.documentation} target="_blank" rel="noopener noreferrer" style={{ color: "var(--vscode-textLink-foreground)", textDecoration: "none" }}>
                  Documentation
                </a>
              )}
            </div>
          )}

          <div className="library-actions">
            {showInstall && (
              <button
                className="action-button install-button"
                disabled={isInstalling || isRemoving}
                onClick={(e) => {
                  e.stopPropagation();
                  onInstall?.();
                }}
              >
                {isInstalling ? "Installing..." : "+ Install"}
              </button>
            )}

            {showInstalledLabel && (
              <span className="installed-badge" style={{ marginTop: "4px" }}>✓ Installed {library.installedVersion ? `(${library.installedVersion})` : ""}</span>
            )}

            {showRemove && (
              <button
                className="action-button remove-button"
                disabled={isInstalling || isRemoving}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.();
                }}
              >
                {isRemoving ? "Removing..." : "Remove"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
