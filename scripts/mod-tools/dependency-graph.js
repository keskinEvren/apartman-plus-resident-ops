/**
 * ASANMOD v1.1.1: NEURO-MAP (Dependency Graph Engine)
 *
 * Usage: node dependency-graph.js [target_file]
 *
 * If target_file is provided, outputs a JSON array of files that import the target (Direct Dependents).
 * If no target, outputs the full graph.
 *
 * Logic:
 * 1. Scan all .ts/.tsx files in src/
 * 2. Parse 'import' statements (Regex for speed).
 * 3. Resolve paths (careful with aliases @/).
 * 4. Build Adjacency List (File -> [Imports]).
 * 5. Invert Graph (File -> [Dependents]).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM Shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = process.cwd();
// MONOREPO FIX: Scan both frontend/src and backend/src
const srcDirs = [
  path.join(rootDir, "frontend"),
  path.join(rootDir, "backend", "src"),
  path.join(rootDir, "mcp-servers"),
];

// Scan these recursively
const scanDirs = ["frontend", "backend", "mcp-servers"].map((d) =>
  path.join(rootDir, d),
);

// Configuration
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const ALIAS_MAP = {
  "@": path.join(rootDir, "frontend"), // Assume @ maps to frontend root for Next.js mostly
  "@backend": path.join(rootDir, "backend", "src"),
  "@mcp": path.join(rootDir, "mcp-servers"),
};

// Colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

// Helper: Recursively get files
function getFiles(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      // Ignore node_modules, .git, and other hidden dirs
      if (file === "node_modules" || file.startsWith(".")) return;

      const filePath = path.join(dir, file);
      // Check for symbolic links loops
      const stat = fs.lstatSync(filePath);

      if (stat.isDirectory() && !stat.isSymbolicLink()) {
        results = results.concat(getFiles(filePath));
      } else {
        if (EXTENSIONS.includes(path.extname(filePath))) {
          results.push(filePath);
        }
      }
    });
  } catch (e) {
    if (process.env.DEBUG)
      console.error(`[DEBUG] Skipped dir ${dir}: ${e.message}`);
  }
  return results;
}

// Helper: Resolve import path to absolute file path
function resolveImport(sourceFile, importPath) {
  // Handle Alias @/
  let candidate = null;
  if (importPath.startsWith("@/")) {
    candidate = path.join(ALIAS_MAP["@"], importPath.substring(2));
  } else if (importPath.startsWith("@backend/")) {
    candidate = path.join(ALIAS_MAP["@backend"], importPath.substring(9));
  } else if (importPath.startsWith(".")) {
    candidate = path.resolve(path.dirname(sourceFile), importPath);
  } else {
    // Node modules or unknown - ignore for now
    return null;
  }

  if (candidate) {
    // Try extensions
    for (const ext of ["", ...EXTENSIONS, "/index.ts", "/index.tsx"]) {
      const testPath = candidate + ext;
      if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
        return testPath;
      }
    }
  }
  return null;
}

// Core: Build Graph
function buildGraph() {
  let files = [];
  scanDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      files = files.concat(getFiles(dir));
    }
  });

  const graph = {}; // File -> [Imports]

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    const imports = [];

    // Regex for imports: import ... from '...'
    // Captures both static imports and dynamic imports regex is tricky, sticking to static for speed
    const importRegex = /import\s+(?:[\w\s{},*]+)\s+from\s+['"]([^'"]+)['"]/g;
    const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Resolve imports
    const resolvedImports = [];
    imports.forEach((imp) => {
      const resolved = resolveImport(file, imp);
      if (resolved) {
        resolvedImports.push(resolved);
      } else if (process.env.DEBUG) {
        console.error(
          `${colors.red}[DEBUG] Failed to resolve: ${imp} in ${file}${colors.reset}`,
        );
      }
    });

    graph[file] = resolvedImports;
  });

  if (process.env.DEBUG)
    console.error(`[DEBUG] Scanned ${files.length} files.`);
  return graph;
}

// Invert Graph: File -> [Dependents] (Who imports me?)
function invertGraph(forwardGraph) {
  const reverseGraph = {};

  Object.keys(forwardGraph).forEach((file) => {
    if (!reverseGraph[file]) reverseGraph[file] = []; // Ensure node exists

    const imports = forwardGraph[file];
    imports.forEach((imp) => {
      if (!reverseGraph[imp]) reverseGraph[imp] = [];
      if (!reverseGraph[imp].includes(file)) {
        reverseGraph[imp].push(file);
      }
    });
  });

  return reverseGraph;
}

// Main
const targetFile = process.argv[2] ? path.resolve(process.argv[2]) : null;

console.error(
  `${colors.blue}[NEURO-MAP] Building Dependency Graph...${colors.reset}`,
);
const t0 = performance.now();

const forwardGraph = buildGraph();
const reverseGraph = invertGraph(forwardGraph);

const t1 = performance.now();
console.error(
  `${colors.gray}Graph built in ${(t1 - t0).toFixed(2)}ms${colors.reset}`,
);

if (targetFile) {
  if (!fs.existsSync(targetFile)) {
    console.error(
      `${colors.red}Target file not found: ${targetFile}${colors.reset}`,
    );
    process.exit(1);
  }

  const dependents = reverseGraph[targetFile] || [];

  // Output JSON for machine consumption
  console.log(
    JSON.stringify(
      {
        target: targetFile,
        dependents: dependents,
        count: dependents.length,
      },
      null,
      2,
    ),
  );
} else {
  // Output full stats
  console.log(
    JSON.stringify(
      {
        totalFiles: Object.keys(forwardGraph).length,
        relationships: Object.values(forwardGraph).reduce(
          (acc, i) => acc + i.length,
          0,
        ),
      },
      null,
      2,
    ),
  );
}
