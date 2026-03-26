import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

export async function launchSimulatorUi(apiUrl: string, sandboxId: string): Promise<void> {
  const electronBinary = require("electron") as string;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const entrypoint = path.join(__dirname, "electron", "main.js");

  const child = spawn(
    electronBinary,
    [entrypoint, "--api-url", apiUrl, "--sandbox-id", sandboxId],
    {
      stdio: "inherit",
    }
  );

  await new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code && code !== 0) {
        reject(new Error(`Electron exited with status ${code}`));
        return;
      }
      resolve();
    });
  });
}
