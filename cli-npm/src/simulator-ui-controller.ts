import { ApiClient } from "./api.js";

export interface SimulatorSessionInfo {
  sandboxId: string;
  deviceName: string;
  udid: string;
  pointWidth: number;
  pointHeight: number;
  xcodeVersion: string;
  macosVersion: string;
}

type SimulatorButton = "home" | "lock" | "siri" | "side-button" | "apple-pay";

const BUTTON_MAP: Record<SimulatorButton, string> = {
  home: "HOME",
  lock: "LOCK",
  siri: "SIRI",
  "side-button": "SIDE_BUTTON",
  "apple-pay": "APPLE_PAY",
};

export class SimulatorUiController {
  private sessionInfo: SimulatorSessionInfo | null = null;

  constructor(
    private readonly client: ApiClient,
    private readonly sandboxId: string,
  ) {}

  async bootstrap(): Promise<SimulatorSessionInfo> {
    const status = await this.client.sandboxStatus(this.sandboxId);
    const simulator = status.booted_simulators[0];

    if (!simulator) {
      throw new Error(
        `No booted iOS simulator found for ${this.sandboxId}. Run: cider ${this.sandboxId} --emulator ios`
      );
    }

    const describe = await this.runCommand(
      `idb describe --udid ${shellQuote(simulator.udid)}`,
      "Unable to read simulator dimensions with idb"
    );

    const pointWidth = extractMetric(describe.stdout, "width_points");
    const pointHeight = extractMetric(describe.stdout, "height_points");

    this.sessionInfo = {
      sandboxId: this.sandboxId,
      deviceName: simulator.name,
      udid: simulator.udid,
      pointWidth,
      pointHeight,
      xcodeVersion: status.xcode,
      macosVersion: status.macos_version,
    };

    return this.sessionInfo;
  }

  async refreshSession(): Promise<SimulatorSessionInfo> {
    return this.bootstrap();
  }

  async captureScreenshotDataUrl(): Promise<string> {
    await this.ensureSession();
    const buffer = await this.client.screenshot(this.sandboxId);
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  }

  async tap(x: number, y: number): Promise<void> {
    const session = await this.ensureSession();
    await this.runCommand(
      `idb ui tap ${roundCoord(x)} ${roundCoord(y)} --udid ${shellQuote(session.udid)}`,
      "Tap failed"
    );
  }

  async swipe(startX: number, startY: number, endX: number, endY: number, duration = 0.18): Promise<void> {
    const session = await this.ensureSession();
    await this.runCommand(
      `idb ui swipe ${roundCoord(startX)} ${roundCoord(startY)} ${roundCoord(endX)} ${roundCoord(endY)} --duration ${duration} --udid ${shellQuote(session.udid)}`,
      "Swipe failed"
    );
  }

  async inputText(text: string): Promise<void> {
    const session = await this.ensureSession();
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("Text input cannot be empty");
    }

    await this.runCommand(
      `idb ui text ${shellQuote(trimmed)} --udid ${shellQuote(session.udid)}`,
      "Text input failed"
    );
  }

  async pressButton(button: SimulatorButton): Promise<void> {
    const session = await this.ensureSession();
    await this.runCommand(
      `idb ui button ${BUTTON_MAP[button]} --udid ${shellQuote(session.udid)}`,
      `Button press failed: ${button}`
    );
  }

  private async ensureSession(): Promise<SimulatorSessionInfo> {
    if (!this.sessionInfo) {
      return this.bootstrap();
    }
    return this.sessionInfo;
  }

  private async runCommand(command: string, errorPrefix: string) {
    const result = await this.client.exec(this.sandboxId, command);
    if (result.exit_code !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim() || "unknown error";
      throw new Error(`${errorPrefix}: ${detail}`);
    }
    return result;
  }
}

function extractMetric(output: string, metric: string): number {
  const match = output.match(new RegExp(`${metric}=(\\d+)`));
  if (!match) {
    throw new Error(`idb describe output did not contain ${metric}`);
  }
  return Number(match[1]);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function roundCoord(value: number): number {
  return Math.max(0, Math.round(value));
}
