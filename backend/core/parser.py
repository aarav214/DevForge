"""
DevForge Repository Parser
"""

import json
import os
import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Set

try:
    import tomllib
except ImportError:
    import tomli as tomllib


class RepositoryParser:
    SUPPORTED_FILES = {
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "Cargo.toml",
        "go.mod",
        "pom.xml",
        "pubspec.yaml",
    }

    SKIP_DIRS = {
        ".git", ".github", ".idea", ".vscode",
        "node_modules", "__pycache__", ".venv", "venv",
        ".next", ".turbo", "dist", "build", "coverage",
        ".dart_tool", "target", ".gradle"
    }

    JS_FRAMEWORKS = {
        "next": "Next.js",
        "react": "React",
        "vue": "Vue",
        "@angular/core": "Angular",
        "@nestjs/core": "NestJS",
        "svelte": "Svelte",
    }

    PY_FRAMEWORKS = {
        "fastapi": "FastAPI",
        "django": "Django",
        "flask": "Flask",
        "streamlit": "Streamlit",
    }

    DATABASES = {
        "prisma": "Prisma ORM",
        "@prisma/client": "Prisma ORM",
        "sqlalchemy": "SQLAlchemy",
        "mongoose": "MongoDB (Mongoose)",
        "typeorm": "TypeORM",
        "drizzle-orm": "Drizzle ORM",
        "psycopg2": "PostgreSQL",
        "mysql2": "MySQL",
        "sqlite3": "SQLite",
    }

    def __init__(self, root: str):
        self.root = os.path.abspath(root)

    def discover_files(self) -> List[str]:
        manifests = []
        for current, dirs, files in os.walk(self.root):
            dirs[:] = [d for d in dirs if d not in self.SKIP_DIRS]
            for f in files:
                if f in self.SUPPORTED_FILES:
                    manifests.append(os.path.join(current, f))
        return manifests

    def detect_js_framework(self, deps):
        for k, v in self.JS_FRAMEWORKS.items():
            if k in deps:
                return v
        return "JavaScript"

    def detect_python_framework(self, deps):
        for k, v in self.PY_FRAMEWORKS.items():
            if k in deps:
                return v
        return "Python"

    def detect_database(self, deps):
        found = []
        for k, v in self.DATABASES.items():
            if k in deps:
                found.append(v)
        return sorted(set(found))

    def detect_package_manager(self, folder):
        if os.path.exists(os.path.join(folder, "pnpm-lock.yaml")):
            return "pnpm"
        if os.path.exists(os.path.join(folder, "yarn.lock")):
            return "yarn"
        if os.path.exists(os.path.join(folder, "bun.lockb")):
            return "bun"
        if os.path.exists(os.path.join(folder, "package-lock.json")):
            return "npm"
        return "unknown"

    def parse_package_json(self, path):
        with open(path, encoding="utf8") as f:
            data = json.load(f)

        deps = {}
        deps.update(data.get("dependencies", {}))
        deps.update(data.get("devDependencies", {}))

        return {
            "path": os.path.relpath(os.path.dirname(path), self.root),
            "language": "JavaScript/TypeScript",
            "framework": self.detect_js_framework(deps),
            "package_manager": self.detect_package_manager(os.path.dirname(path)),
            "database": self.detect_database(deps),
            "dependencies": dict(sorted(deps.items())),
            "scripts": data.get("scripts", {}),
        }

    def parse_requirements(self, path):
        deps = {}
        with open(path, encoding="utf8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                name = line
                version = ""
                for sep in ["==", ">=", "<=", "~=", ">", "<"]:
                    if sep in line:
                        name, version = line.split(sep, 1)
                        break
                deps[name.strip()] = version.strip()
        return {
            "path": os.path.relpath(os.path.dirname(path), self.root),
            "language": "Python",
            "framework": self.detect_python_framework(deps),
            "package_manager": "pip",
            "database": self.detect_database(deps),
            "dependencies": dict(sorted(deps.items())),
        }

    def parse_pyproject(self, path):
        with open(path, "rb") as f:
            data = tomllib.load(f)
        deps = {}
        for item in data.get("project", {}).get("dependencies", []):
            name = item.split(">=")[0].split("==")[0].strip()
            deps[name] = ""
        return {
            "path": os.path.relpath(os.path.dirname(path), self.root),
            "language": "Python",
            "framework": self.detect_python_framework(deps),
            "package_manager": "pip",
            "database": self.detect_database(deps),
            "dependencies": dict(sorted(deps.items())),
        }

    def parse_cargo(self, path):
        with open(path, "rb") as f:
            data = tomllib.load(f)
        deps = data.get("dependencies", {})
        return {
            "path": os.path.relpath(os.path.dirname(path), self.root),
            "language": "Rust",
            "framework": "Rust",
            "package_manager": "cargo",
            "database": [],
            "dependencies": dict(sorted(deps.items())),
        }

    def parse_go(self, path):
        deps = {}
        with open(path, encoding="utf8") as f:
            for line in f:
                line=line.strip()
                if "/" in line and " " in line:
                    p=line.split()
                    deps[p[0]]=p[1] if len(p)>1 else ""
        return {
            "path": os.path.relpath(os.path.dirname(path), self.root),
            "language":"Go",
            "framework":"Go",
            "package_manager":"go",
            "database":[],
            "dependencies":dict(sorted(deps.items()))
        }

    def parse_pubspec(self, path):
        deps={}
        inside=False
        with open(path,encoding="utf8") as f:
            for line in f:
                if line.startswith("dependencies:"):
                    inside=True
                    continue
                if inside:
                    if line and not line.startswith("  "):
                        break
                    if ":" in line:
                        k,v=line.split(":",1)
                        deps[k.strip()]=v.strip()
        return {
            "path":os.path.relpath(os.path.dirname(path),self.root),
            "language":"Dart",
            "framework":"Flutter",
            "package_manager":"pub",
            "database":[],
            "dependencies":dict(sorted(deps.items()))
        }

    def parse_pom(self,path):
        tree=ET.parse(path)
        root=tree.getroot()
        deps={}
        for node in root.iter():
            if node.tag.endswith("artifactId") and node.text:
                deps[node.text]=""
        return {
            "path":os.path.relpath(os.path.dirname(path),self.root),
            "language":"Java",
            "framework":"Java",
            "package_manager":"maven",
            "database":[],
            "dependencies":dict(sorted(deps.items()))
        }

    def analyze(self)->Dict[str,Any]:
        projects=[]
        langs:Set[str]=set()
        frameworks:Set[str]=set()
        dbs:Set[str]=set()

        for manifest in self.discover_files():
            name=os.path.basename(manifest)
            try:
                if name=="package.json":
                    p=self.parse_package_json(manifest)
                elif name=="requirements.txt":
                    p=self.parse_requirements(manifest)
                elif name=="pyproject.toml":
                    p=self.parse_pyproject(manifest)
                elif name=="Cargo.toml":
                    p=self.parse_cargo(manifest)
                elif name=="go.mod":
                    p=self.parse_go(manifest)
                elif name=="pom.xml":
                    p=self.parse_pom(manifest)
                elif name=="pubspec.yaml":
                    p=self.parse_pubspec(manifest)
                else:
                    continue
                projects.append(p)
                langs.add(p["language"])
                frameworks.add(p["framework"])
                for d in p["database"]:
                    dbs.add(d)
            except Exception as e:
                projects.append({"path":manifest,"error":str(e)})

        repo_type = "Polyglot Monorepo" if len(projects) > 1 else "Single Project"

        return {
            "repository": os.path.basename(self.root),
            "repository_type": repo_type,
            "manifest_count": len(projects),
            "summary": {
                "languages": sorted(langs),
                "frameworks": sorted(frameworks),
                "databases": sorted(dbs),
            },
            "projects": projects,
        }
