import React from "react";

interface ErrorStateProps {
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  retryLabel = "Retry",
  onRetry,
}) => {
  return (
    <div className="state-container">
      <div style={{ fontSize: "20px", color: "var(--vscode-errorForeground)" }}>⚠</div>
      <div style={{ color: "var(--vscode-errorForeground)" }}>{message}</div>
      {onRetry && (
        <button className="state-button" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
};
