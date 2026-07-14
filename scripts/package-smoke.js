import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const outDir = mkdtempSync(join(tmpdir(), "connector-impact-pack-"));

try {
  const packOutput = execFileSync("npm", ["pack", "--json", "--pack-destination", outDir], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const [{ filename, files }] = JSON.parse(packOutput);
  const names = new Set(files.map((file) => file.path));
  const required = [
    "dist/src/cli.js",
    "dist/src/index.js",
    "dist/tests/impact.test.js",
    "README.md",
    "SKILL.md",
    "docs/VERIFICATION.md",
    "examples/sample.txt",
    "examples/plan.json",
    "LICENSE",
    "CHANGELOG.md",
  ];
  const missing = required.filter((file) => !names.has(file));
  if (missing.length > 0) {
    throw new Error(`npm pack is missing required files: ${missing.join(", ")}`);
  }

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  if (!packageJson.repository?.url || !packageJson.bugs?.url || !packageJson.homepage) {
    throw new Error("package metadata must include repository, bugs, and homepage URLs");
  }
  const files = packageJson.files ?? [];
  const duplicateFiles = files.filter((file, index) => files.indexOf(file) !== index);
  if (duplicateFiles.length > 0) {
    throw new Error(`package files allowlist has duplicates: ${duplicateFiles.join(", ")}`);
  }

  console.log(`package smoke passed: ${filename}`);
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
