# DevForge AI: Webview UI Frontend

This folder contains the React & TypeScript frontend for DevForge AI. It is designed to run inside a VS Code Webview panel, communicating with the Extension Host via message passing, but can also be compiled and tested locally as a standard Vite application.

---

## 🚀 Key Features

1. **Multi-Registry Search**:
   * Blends and deduplicates local curated package directories with live search queries against 8 package registries.
   * Debounced user queries to optimize network overhead.

2. **Ecosystem Filtering Chips**:
   * Interactive chips to filter packages dynamically across:
     * **npm** (Node.js)
     * **PyPI** (Python)
     * **crates.io** (Rust/Cargo)
     * **NuGet** (.NET)
     * **Maven Central** (Java)
     * **RubyGems** (Ruby)
     * **Packagist** (PHP/Composer)
     * **pub.dev** (Flutter/Dart)

3. **Context-Aware AI Chat Box (Ask AI)**:
   * Direct model integration supporting queries scoped to recommendations, security audits, performance reviews, and bug resolution.
   * Seamless layout styling that positions the chat box elegantly beneath project health scans.

4. **Lazy-Loaded Repository Metrics**:
   * Live statistics (downloads, stars, updates, and open issues) are retrieved via lazy-loading *only* when a package card is expanded to prevent API rate-limiting.

5. **Copyable Installation Snippets**:
   * Instantly copies ecosystem-aware shell commands (e.g. `npm install`, `poetry add`, `cargo add`, `composer require`) configured for the target library.

---

## 🛠️ Technology Stack

* **Build Tooling**: [Vite](https://vite.dev/) (Vite + TypeScript React configuration)
* **Core Framework**: React 18
* **Language**: TypeScript (strict typechecks enabled)
* **CSS & Styling**: Tailwind CSS utilities + custom premium micro-animations

---

## 💻 Local Development Setup

To run the React application in your browser for development, execute the following commands from the root directory:

```bash
cd webview-ui
npm install
npm run dev
```

The app will be available locally (typically at `http://localhost:5173/`).

---

## 📦 Production Build

To compile the application into static HTML and JavaScript assets for inclusion inside the VS Code Extension:

```bash
npm run build
```

This compiles the code through the TypeScript compiler (`tsc`) and outputs minified production assets directly into the `dist/` directory, which is loaded by the extension backend module.
