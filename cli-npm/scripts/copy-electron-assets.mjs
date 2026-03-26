import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "src", "electron");
const targetDir = path.join(rootDir, "dist", "electron");

const assetFiles = ["renderer.html", "renderer.css", "preload.cjs"];

// Remove stale preload.js / preload.d.ts left over from when preload was a .ts file.
// Electron's sandboxed renderer can accidentally pick up preload.js (which has ESM imports
// and is invalid in the preload context) if it sits next to preload.cjs.
const staleFiles = ["preload.js", "preload.d.ts"];
for (const file of staleFiles) {
  await fs.rm(path.join(targetDir, file), { force: true });
}

await fs.mkdir(targetDir, { recursive: true });

for (const file of assetFiles) {
  await fs.copyFile(path.join(sourceDir, file), path.join(targetDir, file));
}
