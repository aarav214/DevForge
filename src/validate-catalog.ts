import * as fs from "fs";
import * as path from "path";
import { RegistryService } from "./lib/registries/registry-service";
import { LIBRARIES } from "../webview-ui/src/mockData";

async function runValidation() {
  console.log(`Starting DevForge catalog validation for ${LIBRARIES.length} entries...`);
  
  const registryService = new RegistryService();
  const report = {
    valid: [] as string[],
    invalid: [] as string[],
    duplicate: [] as string[],
    deprecated: [] as string[],
    placeholder: [] as string[],
    unknown: [] as string[]
  };

  const seen = new Set<string>();

  for (const lib of LIBRARIES) {
    const key = `${lib.ecosystem}:${lib.packageName.toLowerCase()}`;
    
    // Check duplicates
    if (seen.has(key)) {
      console.log(`[DUPLICATE] ${lib.packageName} in ${lib.ecosystem}`);
      report.duplicate.push(`${lib.ecosystem}:${lib.packageName}`);
      continue;
    }
    seen.add(key);

    // Identify known placeholders/fake packages
    if (lib.id === "legacy3d" || lib.id === "old-auth" || lib.packageName.includes("-001")) {
      console.log(`[PLACEHOLDER] Synthetic package flagged: ${lib.packageName} (${lib.id})`);
      report.placeholder.push(`${lib.ecosystem}:${lib.packageName}`);
      continue;
    }

    try {
      const livePkg = await registryService.getPackage(lib.packageName, lib.ecosystem);
      if (livePkg) {
        if (livePkg.deprecated) {
          console.log(`[DEPRECATED] ${lib.packageName} is marked deprecated in ${lib.ecosystem}`);
          report.deprecated.push(`${lib.ecosystem}:${lib.packageName}`);
        } else {
          console.log(`[VALID] Verified ${lib.packageName} exists in ${lib.ecosystem}`);
          report.valid.push(`${lib.ecosystem}:${lib.packageName}`);
        }
      } else {
        console.log(`[INVALID] ${lib.packageName} not found in ${lib.ecosystem} (404)`);
        report.invalid.push(`${lib.ecosystem}:${lib.packageName}`);
      }
    } catch (err: any) {
      console.warn(`[UNKNOWN] Query failed for ${lib.packageName} in ${lib.ecosystem}: ${err.message}`);
      report.unknown.push(`${lib.ecosystem}:${lib.packageName}`);
    }
  }

  // Write report
  const reportPath = path.join(__dirname, "..", "validation_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  
  console.log("\n==================================================");
  console.log("Validation Complete!");
  console.log(`Valid: ${report.valid.length}`);
  console.log(`Invalid: ${report.invalid.length}`);
  console.log(`Duplicates: ${report.duplicate.length}`);
  console.log(`Deprecated: ${report.deprecated.length}`);
  console.log(`Placeholders Flagged: ${report.placeholder.length}`);
  console.log(`Unknown/Errors: ${report.unknown.length}`);
  console.log(`Report saved to: ${reportPath}`);
  console.log("==================================================");
}

runValidation().catch((err) => {
  console.error("Validation runner crashed:", err);
});
