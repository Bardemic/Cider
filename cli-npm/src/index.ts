#!/usr/bin/env node

import readline from "node:readline";
import { loadConfig, saveConfig } from "./config.js";
import { ApiClient } from "./api.js";
import { ui } from "./ui.js";
import { runAgent } from "./agent.js";

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd) {
  printUsage();
  process.exit(0);
}

const cfg = loadConfig();

switch (cmd) {
  case "create":
    await cmdCreate();
    break;
  case "list":
  case "ls":
    await cmdList();
    break;
  case "stop":
  case "delete":
    if (!args[1]) ui.fatal("Usage: cider stop <ID>");
    await cmdStop(args[1]);
    break;
  case "login":
    cmdLogin();
    break;
  case "google":
    if (args[1] === "login") await cmdGoogleLogin();
    else printUsage();
    break;
  case "status":
    await cmdStatus();
    break;
  case "help":
  case "--help":
  case "-h":
    printUsage();
    break;
  case "version":
  case "--version":
  case "-v":
    console.log("cider v0.2.0");
    break;
  default:
    await cmdSandboxAction(cmd);
    break;
}

// --- Commands ---

async function cmdCreate() {
  const repoIdx = args.indexOf("--repo");
  const repo = repoIdx !== -1 ? args[repoIdx + 1] : undefined;

  const client = new ApiClient(cfg.apiUrl);

  console.log();
  if (repo) {
    console.log(`  \x1b[33m⠋\x1b[0m Creating sandbox with repo ${ui.dim(repo)}...`);
  } else {
    console.log(`  \x1b[33m⠋\x1b[0m Creating sandbox...`);
  }

  try {
    const sandbox = await client.createSandbox(repo);
    cfg.activeSandbox = sandbox.id;
    saveConfig(cfg);

    ui.done("Sandbox ready");
    console.log();
    ui.kv("ID", ui.brand(sandbox.id));
    ui.kv("VM", sandbox.vm_name);
    ui.kv("IP", sandbox.ip || "pending");
    ui.kv("Status", ui.success(sandbox.status));
    console.log();
    console.log(`  ${ui.dim("Next steps:")}`);
    console.log(`  ${ui.dim(`  cider ${sandbox.id} --emulator ios    # boot iOS simulator`)}`);
    console.log(`  ${ui.dim(`  cider ${sandbox.id} --google          # start Gemini agent`)}`);
    console.log(`  ${ui.dim(`  cider stop ${sandbox.id}              # stop and delete`)}`);
    console.log();
  } catch (err) {
    ui.fatal(`Failed to create sandbox: ${err instanceof Error ? err.message : err}`);
  }
}

async function cmdList() {
  const client = new ApiClient(cfg.apiUrl);

  try {
    const sandboxes = await client.listSandboxes();
    console.log();

    if (sandboxes.length === 0) {
      console.log(`  ${ui.dim("No sandboxes. Run: cider create")}\n`);
      return;
    }

    console.log(
      `  ${ui.bold(ui.dim(`${"ID".padEnd(14)} ${"VM".padEnd(22)} ${"IP".padEnd(16)} ${"STATUS".padEnd(10)} CREATED`))}`
    );
    for (const s of sandboxes) {
      let statusStr: string;
      switch (s.status) {
        case "running": statusStr = ui.success(s.status); break;
        case "creating": statusStr = ui.info(s.status); break;
        case "error": statusStr = ui.error(s.status); break;
        default: statusStr = ui.dim(s.status);
      }
      console.log(
        `  ${ui.brand(s.id.padEnd(14))} ${s.vm_name.padEnd(22)} ${(s.ip || "-").padEnd(16)} ${statusStr.padEnd(10 + statusStr.length - s.status.length)} ${ui.dim(s.created_at)}`
      );
    }
    console.log();
  } catch (err) {
    ui.fatal(`Failed to list sandboxes: ${err instanceof Error ? err.message : err}`);
  }
}

async function cmdStop(id: string) {
  const client = new ApiClient(cfg.apiUrl);

  console.log(`\n  Stopping sandbox ${ui.brand(id)}...`);

  try {
    await client.deleteSandbox(id);
    if (cfg.activeSandbox === id) {
      cfg.activeSandbox = "";
      saveConfig(cfg);
    }
    ui.done(`Sandbox ${id} stopped and deleted`);
    console.log();
  } catch (err) {
    ui.fatal(`Failed to stop sandbox: ${err instanceof Error ? err.message : err}`);
  }
}

function cmdLogin() {
  const dashboardUrl = process.env.CIDER_DASHBOARD_URL || "http://localhost:3000";
  const loginUrl = `${dashboardUrl}/login`;

  console.log(`\n  Opening ${ui.brand(loginUrl)}...\n`);

  import("node:child_process").then(({ exec }) => {
    const cmd =
      process.platform === "darwin" ? `open "${loginUrl}"` :
      process.platform === "win32" ? `rundll32 url.dll,FileProtocolHandler "${loginUrl}"` :
      `xdg-open "${loginUrl}"`;
    exec(cmd, (err) => {
      if (err) console.log(`  ${ui.dim("Could not open browser.")} Visit manually: ${loginUrl}\n`);
      else ui.done("Browser opened. Complete login there, then return here.\n");
    });
  });
}

async function cmdGoogleLogin() {
  console.log();
  console.log(`  \x1b[38;5;208m\x1b[1mGemini API Authentication\x1b[0m\n`);
  console.log(`  ${ui.dim("Get your API key at: https://aistudio.google.com/apikey")}\n`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const key = await new Promise<string>((resolve) => {
    rl.question("  Enter your Gemini API key: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!key) ui.fatal("No key provided.");

  process.stderr.write("  Validating...");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    cfg.geminiApiKey = key;
    saveConfig(cfg);

    process.stderr.write("\x1b[2K\r");
    ui.done("API key saved");
    console.log(`  ${ui.dim("Stored in ~/.cider/config.json")}\n`);
  } catch (err) {
    process.stderr.write("\x1b[2K\r");
    ui.fatal(`Invalid API key: ${err instanceof Error ? err.message : err}`);
  }
}

async function cmdStatus() {
  const client = new ApiClient(cfg.apiUrl);

  ui.banner();
  ui.kv("Host", cfg.apiUrl);

  try {
    const sandboxes = await client.listSandboxes();
    ui.done(`Connected — ${sandboxes.length} sandbox(es)`);
  } catch (err) {
    console.log(`  ${ui.error("✗")} Cannot reach host at ${cfg.apiUrl}`);
    console.log(`  ${ui.dim(err instanceof Error ? err.message : String(err))}\n`);
    return;
  }

  if (cfg.geminiApiKey) ui.kv("Gemini", ui.success("configured"));
  else ui.kv("Gemini", ui.dim("not configured — run: cider google login"));

  if (cfg.activeSandbox) ui.kv("Active", ui.brand(cfg.activeSandbox));
  console.log();
}

async function cmdSandboxAction(id: string) {
  if (args.length < 2) {
    console.log(`\n  ${ui.dim("Usage: cider <ID> --emulator ios | --google")}\n`);
    return;
  }

  const client = new ApiClient(cfg.apiUrl);
  const flag = args[1];

  switch (flag) {
    case "--emulator": {
      let device = "iPhone 16";
      if (args[2] && args[2] !== "ios") device = args[2];

      console.log(`\n  Booting ${device} in sandbox ${ui.brand(id)}...`);

      try {
        const result = await client.bootSimulator(id, device);
        if (result.status === "already_booted") ui.done(`${device} already running`);
        else ui.done(`${device} booted`);
      } catch (err) {
        ui.fatal(`Failed to boot simulator: ${err instanceof Error ? err.message : err}`);
      }
      console.log();
      break;
    }

    case "--google": {
      if (!cfg.geminiApiKey) ui.fatal("Gemini not configured. Run: cider google login");

      ui.banner();
      console.log(`  ${ui.dim("Sandbox:")} ${ui.brand(id)}`);
      console.log(`  ${ui.dim("Type your prompt. The agent will build your iOS app.")}`);
      console.log(`  ${ui.dim("Type 'exit' to quit.")}\n`);

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

      const prompt = (query: string) =>
        new Promise<string>((resolve) => rl.question(query, resolve));

      while (true) {
        const input = await prompt(`  \x1b[38;5;208m> \x1b[0m`);
        const trimmed = input.trim();

        if (!trimmed) continue;
        if (trimmed === "exit" || trimmed === "quit") {
          console.log();
          rl.close();
          return;
        }

        try {
          await runAgent(cfg.geminiApiKey!, client, id, trimmed);
          console.log(`\n  ${ui.success("✓ Agent finished")}\n`);
        } catch (err) {
          console.log(`\n  ${ui.error("✗")} ${err instanceof Error ? err.message : err}\n`);
        }
      }
    }

    default:
      console.log(`  Unknown flag: ${flag}`);
      console.log(`  ${ui.dim("Usage: cider <ID> --emulator ios | --google")}\n`);
  }
}

function printUsage() {
  ui.banner();
  console.log(`  ${ui.bold("Usage:")}\n`);
  console.log("    cider create                      Create a new sandbox (Tart VM)");
  console.log("    cider create --repo <url>          Create sandbox with repo cloned");
  console.log("    cider list                         List your sandboxes");
  console.log("    cider status                       Check host server connection");
  console.log("    cider login                        Open dashboard login in browser");
  console.log("    cider google login                 Authenticate with Gemini API key");
  console.log("    cider <ID> --emulator ios           Boot iOS simulator in sandbox");
  console.log("    cider <ID> --google                 Start Gemini agent session");
  console.log("    cider stop <ID>                    Stop and delete a sandbox");
  console.log();
}
