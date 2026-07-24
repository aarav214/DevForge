import { Library, PackageRegistryAdapter, SearchOptions } from "./types";
import { fetchJson } from "./utils";

export class MavenAdapter implements PackageRegistryAdapter {
  readonly ecosystem = "maven";

  async search(query: string, options?: SearchOptions): Promise<Library[]> {
    if (!query.trim()) return [];
    try {
      let solrQuery = "";
      if (query.includes(":")) {
        const parts = query.split(":");
        if (parts.length >= 2) {
          solrQuery = `g:${encodeURIComponent(parts[0].trim())}+AND+a:${encodeURIComponent(parts[1].trim())}`;
        } else {
          solrQuery = encodeURIComponent(query);
        }
      } else {
        solrQuery = encodeURIComponent(query);
      }

      const url = `https://search.maven.org/solrsearch/select?q=${solrQuery}&rows=${options?.limit || 20}&wt=json`;
      const data = await fetchJson(url);
      const docs = data.response?.docs || [];

      return docs.map((doc: any) => {
        const packageId = `${doc.g}:${doc.a}`;
        return {
          id: packageId,
          name: doc.a,
          description: `Maven Central package. Group: ${doc.g}, Artifact: ${doc.a}`,
          ecosystem: this.ecosystem,
          packageName: packageId,
          latestVersion: doc.v,
          lastUpdated: doc.timestamp ? new Date(doc.timestamp).toLocaleDateString() : undefined,
          license: doc.ec?.join(", "), // class list or properties if returned
          installed: false,
          source: "registry"
        } as Library;
      });
    } catch (e) {
      console.error("Maven search error:", e);
      return [];
    }
  }

  async getPackage(packageName: string): Promise<Library | null> {
    try {
      let g = "";
      let a = "";
      if (packageName.includes(":")) {
        const parts = packageName.split(":");
        g = parts[0].trim();
        a = parts[1].trim();
      } else {
        // Fallback if searched without group id
        g = "*";
        a = packageName.trim();
      }

      const url = `https://search.maven.org/solrsearch/select?q=g:${encodeURIComponent(g)}+AND+a:${encodeURIComponent(a)}&rows=1&wt=json`;
      const data = await fetchJson(url);
      const docs = data.response?.docs || [];
      if (docs.length === 0) return null;

      const doc = docs[0];
      const packageId = `${doc.g}:${doc.a}`;

      return {
        id: packageId,
        name: doc.a,
        description: `Maven Central package. Group: ${doc.g}, Artifact: ${doc.a}`,
        ecosystem: this.ecosystem,
        packageName: packageId,
        latestVersion: doc.v,
        lastUpdated: doc.timestamp ? new Date(doc.timestamp).toLocaleDateString() : undefined,
        installed: false,
        source: "registry"
      } as Library;
    } catch (e) {
      console.error(`Maven getPackage error for ${packageName}:`, e);
      return null;
    }
  }

  getInstallCommand(packageName: string): string {
    let g = "groupId";
    let a = "artifactId";
    let v = "version";
    if (packageName.includes(":")) {
      const parts = packageName.split(":");
      g = parts[0];
      a = parts[1];
    }
    return `// Gradle\nimplementation("${g}:${a}:${v}")\n\n<!-- Maven pom.xml -->\n<dependency>\n  <groupId>${g}</groupId>\n  <artifactId>${a}</artifactId>\n  <version>${v}</version>\n</dependency>`;
  }
}
