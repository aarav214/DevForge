import React, { useState, useRef, useEffect } from "react";
import { Library } from "../types";
import { LibraryCard } from "./LibraryCard";

interface AiBoxProps {
  loading: boolean;
  onSendQuery: (query: string) => void;
  response: { summary: string; recommendations: Library[] } | null;
  onInstallLibrary?: (lib: Library) => void;
  isActionPending?: (packageName: string) => boolean;
}

export const AiBox: React.FC<AiBoxProps> = ({
  loading,
  onSendQuery,
  response,
  onInstallLibrary,
  isActionPending,
}) => {
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    onSendQuery(query);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [query]);

  return (
    <div className="ai-box-container">
      {response && (
        <div className="ai-response-container">
          <p className="ai-summary">{response.summary}</p>
          <div className="ai-recommendations-list">
            {response.recommendations.map((lib) => (
              <LibraryCard
                key={`${lib.ecosystem}:${lib.packageName}`}
                library={lib}
                context="ai-recommendation"
                isInstalling={isActionPending?.(lib.packageName)}
                onInstall={() => onInstallLibrary?.(lib)}
                onExpand={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      <div className="ai-box-header" style={{ marginTop: response ? "8px" : "0" }}>
        <span className="ai-sparkle">✦</span>
        <span>Confused by so many options?</span>
      </div>
      <p className="ai-box-subtitle">Tell AI what you're building...</p>

      <form onSubmit={handleSubmit} className="ai-box-form">
        <textarea
          ref={textareaRef}
          rows={1}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g., "I need interactive 3D..."'
          className="ai-box-input"
        />
        <button
          type="button"
          onClick={() => handleSubmit()}
          className="ai-box-send"
          disabled={loading || !query.trim()}
          title="Send query"
        >
          {loading ? "..." : "↑"}
        </button>
      </form>
    </div>
  );
};
