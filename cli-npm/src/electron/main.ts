import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain } from "electron";
import { ApiClient } from "../api.js";
import { SimulatorUiController } from "../simulator-ui-controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiUrl = requiredArg("--api-url");
const sandboxId = requiredArg("--sandbox-id");

const client = new ApiClient(apiUrl);
const controller = new SimulatorUiController(client, sandboxId);

app.whenReady().then(() => {
  registerIpc();

  const mainWindow = new BrowserWindow({
    width: 460,
    height: 960,
    minWidth: 320,
    minHeight: 560,
    title: `Cider Simulator · ${sandboxId}`,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  void mainWindow.loadFile(path.join(__dirname, "renderer.html"));
});

app.on("window-all-closed", () => {
  app.quit();
});

function registerIpc() {
  ipcMain.handle("simulator:init", () => controller.bootstrap());
  ipcMain.handle("simulator:refresh-frame", () => controller.captureScreenshotDataUrl());
  ipcMain.handle("simulator:tap", (_event, x: number, y: number) => controller.tap(x, y));
  ipcMain.handle(
    "simulator:swipe",
    (_event, startX: number, startY: number, endX: number, endY: number, duration?: number) =>
      controller.swipe(startX, startY, endX, endY, duration)
  );
  ipcMain.handle("simulator:text", (_event, text: string) => controller.inputText(text));
  ipcMain.handle("simulator:stream-url", () =>
    `${apiUrl.replace(/^http/, "ws")}/sandboxes/${sandboxId}/ws/video`
  );
}

function requiredArg(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}
