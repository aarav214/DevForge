import { Area, Library } from "./types";

export const AREAS: Area[] = [
  {
    id: "frontend",
    name: "Frontend",
    count: 0,
    categories: [
      { id: "frameworks", name: "Frameworks", count: 0 },
      { id: "ui-components", name: "UI Components", count: 0 },
      { id: "css-styling", name: "CSS & Styling", count: 0 },
      { id: "animation", name: "Animation", count: 0 },
      { id: "3d-graphics", name: "3D & Graphics", count: 0 },
      { id: "state-management", name: "State Management", count: 0 },
      { id: "forms-validation", name: "Forms & Validation", count: 0 },
      { id: "data-fetching", name: "Data Fetching", count: 0 },
      { id: "charts", name: "Charts", count: 0 },
      { id: "maps", name: "Maps", count: 0 },
      { id: "editors", name: "Editors", count: 0 }
    ]
  },
  {
    id: "backend",
    name: "Backend",
    count: 0,
    categories: [
      { id: "web-frameworks", name: "Web Frameworks", count: 0 },
      { id: "db-orms", name: "ORMs & DB Clients", count: 0 },
      { id: "auth-security", name: "Auth & Security", count: 0 },
      { id: "api-utilities", name: "API Utilities", count: 0 }
    ]
  },
  {
    id: "database",
    name: "Database & Data",
    count: 0,
    categories: [
      { id: "postgres-clients", name: "PostgreSQL Clients", count: 0 },
      { id: "key-value", name: "Key-Value Stores", count: 0 },
      { id: "document-dbs", name: "Document Databases", count: 0 }
    ]
  },
  {
    id: "ai-ml",
    name: "AI & ML",
    count: 0,
    categories: [
      { id: "neural-networks", name: "Neural Networks", count: 0 },
      { id: "llm-frameworks", name: "LLM Frameworks", count: 0 },
      { id: "nlp-utilities", name: "NLP Utilities", count: 0 }
    ]
  },
  {
    id: "mobile",
    name: "Mobile",
    count: 0,
    categories: [
      { id: "cross-platform", name: "Cross-Platform", count: 0 },
      { id: "native-wrappers", name: "Native Wrappers", count: 0 }
    ]
  },
  {
    id: "testing",
    name: "Testing & QA",
    count: 0,
    categories: [
      { id: "unit-testing", name: "Unit Testing", count: 0 },
      { id: "e2e-testing", name: "E2E Testing", count: 0 }
    ]
  },
  {
    id: "devops",
    name: "DevOps & Cloud",
    count: 0,
    categories: [
      { id: "containerization", name: "Containerization", count: 0 },
      { id: "ci-cd-helpers", name: "CI/CD Helpers", count: 0 }
    ]
  },
  {
    id: "dev-tools",
    name: "Developer Tools",
    count: 0,
    categories: [
      { id: "linters-formatters", name: "Linters & Formatters", count: 0 },
      { id: "build-tools", name: "Build Tools", count: 0 }
    ]
  }
];

const LIBRARIES_RAW: any[] = [
];

export const LIBRARIES = LIBRARIES_RAW as unknown as Library[];
