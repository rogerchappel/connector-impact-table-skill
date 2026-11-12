import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const outDir = mkdtempSync(join(tmpdir(), "connector-impact-pack-"));

try {
  const packOutput = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const [{ files }] = JSON.parse(packOutput);
  const names = new Set(files.map((file) => file.path));
  const required = [
    "dist/src/cli.js",
    "dist/src/index.js",
    "dist/tests/impact.test.js",
    "scripts/run-tests.js",
    "tests/fixtures/actions-null.json",
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
  const allowlist = packageJson.files ?? [];
  const duplicateFiles = allowlist.filter((file, index) => allowlist.indexOf(file) !== index);
  if (duplicateFiles.length > 0) {
    throw new Error(`package files allowlist has duplicates: ${duplicateFiles.join(", ")}`);
  }

  const packageName = packageJson.name.replace(/^@/, "").replaceAll("/", "-");
  const cliTarget = packageJson.bin?.[packageName];
  if (typeof cliTarget !== "string" || !names.has(cliTarget.replace(/^\.\//, ""))) {
    throw new Error(`npm pack is missing declared CLI target: ${cliTarget ?? "(no CLI target declared)"}`);
  }

  const forbidden = [".github/workflows/ci.yml", "tsconfig.json", "package-lock.json"];
  const includedForbidden = forbidden.filter((file) => names.has(file));
  if (includedForbidden.length > 0) {
    throw new Error(`npm pack includes development-only files: ${includedForbidden.join(", ")}`);
  }

  console.log("package smoke passed: dry-run archive contents verified");
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
