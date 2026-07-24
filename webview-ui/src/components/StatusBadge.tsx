import React from "react";
import { LibraryStatus } from "../types";

interface StatusBadgeProps {
  status: LibraryStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let label = "";
  let icon = "";
  let colorVar = "var(--vscode-descriptionForeground)"; // default

  switch (status) {
    case "active":
      icon = "●";
      label = "Active";
      colorVar = "var(--vscode-testing-iconPassed, #388a34)";
      break;
    case "maintenance":
      icon = "◐";
      label = "Maintenance";
      colorVar = "var(--vscode-editorWarning-foreground, #cca700)";
      break;
    case "inactive":
      icon = "○";
      label = "Inactive";
      colorVar = "var(--vscode-descriptionForeground, #858585)";
      break;
    case "deprecated":
      icon = "⚠";
      label = "Deprecated";
      colorVar = "var(--vscode-errorForeground, #f85149)";
      break;
    case "archived":
      icon = "✕";
      label = "Archived";
      colorVar = "var(--vscode-errorForeground, #f85149)";
      break;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        color: colorVar,
        fontWeight: 500,
        fontSize: "11px",
      }}
    >
      <span style={{ fontSize: status === "deprecated" ? "12px" : "10px" }}>{icon}</span>
      <span>{label}</span>
    </span>
  );
};
