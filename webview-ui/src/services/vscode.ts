interface WebviewApi<State> {
  postMessage(message: any): void;
  getState(): State | undefined;
  setState(state: State): void;
}

declare function acquireVsCodeApi<T = any>(): WebviewApi<T>;

let vscode: WebviewApi<any> | null = null;
try {
  vscode = acquireVsCodeApi();
} catch (e) {
  // Not running inside a VS Code webview
  console.log("VS Code API not available. Running in browser mock mode.");
}

export const vscodeService = {
  postMessage(message: { command: string; [key: string]: any }) {
    if (vscode) {
      vscode.postMessage(message);
    } else {
      console.log("Mock VS Code PostMessage:", message);
    }
  },
  
  requestProject() {
    this.postMessage({ command: "project.get" });
  },

  installLibrary(libraryId: string, ecosystem?: string) {
    this.postMessage({ command: "library.install", libraryId, ecosystem });
  },

  removeLibrary(libraryId: string, ecosystem?: string) {
    this.postMessage({ command: "library.remove", libraryId, ecosystem });
  },

  searchRegistry(query: string, ecosystems?: string[]) {
    this.postMessage({ command: "registry.search", query, ecosystems });
  },

  getPackageDetails(packageName: string, ecosystem: string) {
    this.postMessage({ command: "registry.get", packageName, ecosystem });
  },

  askAI(query: string, mode: "recommend" | "bug" | "architecture" | "chat") {
    this.postMessage({ command: "ai.ask", query, mode });
  }
};
