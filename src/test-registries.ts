import { RegistryService } from "./lib/registries/registry-service";
import { PackageEcosystem } from "./lib/registries/types";

async function runTests() {
  console.log("Starting DevForge Package Registries Integration Tests...\n");
  const service = new RegistryService();

  const testCases: { name: string; ecosystem: PackageEcosystem }[] = [
    { name: "react", ecosystem: "npm" },
    { name: "@tanstack/react-query", ecosystem: "npm" },
    { name: "fastapi", ecosystem: "pypi" },
    { name: "django", ecosystem: "pypi" },
    { name: "serde", ecosystem: "cargo" },
    { name: "Newtonsoft.Json", ecosystem: "nuget" },
    { name: "org.springframework:spring-core", ecosystem: "maven" },
    { name: "rails", ecosystem: "rubygems" },
    { name: "laravel/framework", ecosystem: "packagist" },
    { name: "flutter_bloc", ecosystem: "pub" }
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    console.log(`[TEST] Fetching ${tc.name} from ${tc.ecosystem}...`);
    try {
      const start = Date.now();
      const pkg = await service.getPackage(tc.name, tc.ecosystem);
      const duration = Date.now() - start;

      if (pkg) {
        console.log(`  ✓ Passed (${duration}ms)`);
        console.log(`    Name: ${pkg.name}`);
        console.log(`    Latest Version: ${pkg.latestVersion}`);
        console.log(`    Updated: ${pkg.lastUpdated || "N/A"}`);
        console.log(`    License: ${pkg.license || "N/A"}`);
        console.log(`    Install: ${pkg.installCommand?.replace(/\n/g, " ") || "N/A"}`);
        if (pkg.stars !== undefined) console.log(`    GitHub Stars: ★ ${pkg.stars}`);
        if (pkg.downloads !== undefined) console.log(`    Downloads: ${pkg.downloads.toLocaleString()}`);
        passed++;
      } else {
        console.error(`  ✗ Failed: Package detail lookup returned null`);
        failed++;
      }
    } catch (err: any) {
      console.error(`  ✗ Failed with error: ${err.message}`);
      failed++;
    }
    console.log("--------------------------------------------------");
  }

  // Test Caching Speed
  console.log("\n[TEST] Testing Cache Hit Speed...");
  try {
    // Prime cache
    await service.getPackage("react", "npm");
    
    // Measure second fetch (should hit cache)
    const start = Date.now();
    const pkg = await service.getPackage("react", "npm");
    const duration = Date.now() - start;

    if (pkg && duration < 10) {
      console.log(`  ✓ Passed: Cache resolved in ${duration}ms!`);
      passed++;
    } else {
      console.error(`  ✗ Failed: Cache hit took ${duration}ms (expected < 10ms)`);
      failed++;
    }
  } catch (err: any) {
    console.error(`  ✗ Cache test failed: ${err.message}`);
    failed++;
  }

  // Test Graceful Error/404 Handling
  console.log("\n[TEST] Testing 404/Non-existent Package Handling...");
  try {
    const pkg = await service.getPackage("non-existent-package-abc-xyz-123", "npm");
    if (pkg === null) {
      console.log("  ✓ Passed: Non-existent package returned null gracefully");
      passed++;
    } else {
      console.error("  ✗ Failed: Non-existent package returned an object instead of null");
      failed++;
    }
  } catch (err: any) {
    console.error(`  ✗ Failed: Threw error instead of returning null: ${err.message}`);
    failed++;
  }

  console.log("\n==================================================");
  console.log("Integration Tests Summary");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
