import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolsDir, "..");

const bundledNode = path.join(
  process.env.USERPROFILE || "",
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "node",
  "bin",
  "node.exe",
);

const nodeBin = existsSync(bundledNode) ? bundledNode : process.execPath;

function findGitNexusCli() {
  const projectCli = path.join(repoRoot, "node_modules", "gitnexus", "dist", "cli", "index.js");
  if (existsSync(projectCli)) return projectCli;

  const npxRoot = path.join(repoRoot, ".npm-cache", "_npx");
  if (!existsSync(npxRoot)) return null;

  const candidates = readdirSync(npxRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const cli = path.join(npxRoot, entry.name, "node_modules", "gitnexus", "dist", "cli", "index.js");
      return { cli, mtimeMs: existsSync(cli) ? statSync(cli).mtimeMs : 0 };
    })
    .filter((entry) => entry.mtimeMs > 0)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return candidates[0]?.cli || null;
}

function copyIfPresent(src, dest) {
  if (!existsSync(src)) return;
  if (existsSync(dest) && statSync(src).size === statSync(dest).size) return;
  mkdirSync(path.dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

function ensureRuntimeShims(cliPath) {
  const packageRoot = path.resolve(path.dirname(cliPath), "..", "..");
  const nodeModules = path.dirname(packageRoot);

  copyIfPresent(
    path.join(nodeModules, "graphology", "dist", "graphology.esm.js"),
    path.join(nodeModules, "graphology", "dist", "graphology.mjs"),
  );

  for (const nativeSource of [
    path.join(repoRoot, "node_modules", "@ladybugdb", "core-win32-x64", "lbugjs.node"),
    path.join(repoRoot, ".gitnexus-tarballs", "core-win32-x64", "package", "lbugjs.node"),
  ]) {
    copyIfPresent(nativeSource, path.join(nodeModules, "@ladybugdb", "core", "lbugjs.node"));
  }

  const treeSitterSources = {
    "tree-sitter": ".tree-sitter-imDtU7J7",
    "tree-sitter-c": ".tree-sitter-c-8mGRjwS9",
    "tree-sitter-c-sharp": ".tree-sitter-c-sharp-i2XvASFt",
    "tree-sitter-cpp": ".tree-sitter-cpp-9rkq6lDY",
    "tree-sitter-go": ".tree-sitter-go-ROcGr6bn",
    "tree-sitter-java": ".tree-sitter-java-yzacUEXt",
    "tree-sitter-javascript": ".tree-sitter-javascript-G8AyKJgQ",
    "tree-sitter-php": ".tree-sitter-php-avUowxbN",
    "tree-sitter-python": ".tree-sitter-python-anR23kjK",
    "tree-sitter-ruby": ".tree-sitter-ruby-JQcDAvYW",
    "tree-sitter-rust": ".tree-sitter-rust-46tV1f48",
    "tree-sitter-typescript": ".tree-sitter-typescript-hUipOnNR",
  };

  for (const [packageName, sourceDir] of Object.entries(treeSitterSources)) {
    const srcDir = path.join(repoRoot, "node_modules", sourceDir, "prebuilds", "win32-x64");
    const src = path.join(srcDir, `${packageName}.node`);
    const dest = path.join(nodeModules, packageName, "prebuilds", "win32-x64", `${packageName}.node`);
    copyIfPresent(src, dest);
  }
}

const cli = findGitNexusCli();
if (!cli) {
  console.error("GitNexus CLI is not installed in node_modules or the repo-local npm cache.");
  console.error("Run: npx.cmd --cache .npm-cache --yes gitnexus@1.6.5 --help");
  process.exit(1);
}

ensureRuntimeShims(cli);

const env = {
  ...process.env,
  GITNEXUS_HOME: process.env.GITNEXUS_HOME || path.join(repoRoot, ".gitnexus-home"),
};

const result = spawnSync(nodeBin, [cli, ...process.argv.slice(2)], {
  cwd: repoRoot,
  env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
