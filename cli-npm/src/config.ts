import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface CiderConfig {
  apiUrl: string;
  geminiApiKey: string | null;
  authToken: string | null;
  activeSandbox: string | null;
}

const configDir = path.join(os.homedir(), ".cider");
const configPath = path.join(configDir, "config.json");

export function loadConfig(): CiderConfig {
  const cfg: CiderConfig = {
    apiUrl: "http://localhost:8000",
    geminiApiKey: null,
    authToken: null,
    activeSandbox: null,
  };

  // Env overrides
  if (process.env.CIDER_API_URL) cfg.apiUrl = process.env.CIDER_API_URL;
  if (process.env.GEMINI_API_KEY) cfg.geminiApiKey = process.env.GEMINI_API_KEY;

  // Load from file
  try {
    const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (!process.env.CIDER_API_URL && data.apiUrl) cfg.apiUrl = data.apiUrl;
    if (!process.env.GEMINI_API_KEY && data.geminiApiKey) cfg.geminiApiKey = data.geminiApiKey;
    if (data.authToken) cfg.authToken = data.authToken;
    if (data.activeSandbox) cfg.activeSandbox = data.activeSandbox;
  } catch {
    // No config file yet
  }

  return cfg;
}

export function saveConfig(cfg: CiderConfig) {
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}
