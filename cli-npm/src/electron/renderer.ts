import type { SimulatorSessionInfo } from "../simulator-ui-controller.js";

declare global {
  interface Window {
    ciderSimulator?: {
      init(): Promise<SimulatorSessionInfo>;
      refreshFrame(): Promise<string>;
      tap(x: number, y: number): Promise<void>;
      swipe(startX: number, startY: number, endX: number, endY: number, duration?: number): Promise<void>;
      inputText(text: string): Promise<void>;
      getStreamUrl(): Promise<string>;
    };
  }
}

interface DevicePoint {
  x: number;
  y: number;
}

class CiderSimulatorApp {
  private session: SimulatorSessionInfo | null = null;
  private pointerStart: DevicePoint | null = null;
  private pendingText = "";
  private textFlushTimer: number | null = null;
  private readonly movementThreshold = 14;

  private readonly stage = requiredElement<HTMLDivElement>("stage");
  private readonly deviceImage = requiredElement<HTMLImageElement>("device-image");
  private readonly loading = requiredElement<HTMLDivElement>("loading-state");

  async init() {
    if (!window.ciderSimulator) {
      this.loading.textContent = "Preload bridge did not initialize.";
      return;
    }

    this.bindEvents();

    try {
      this.session = await window.ciderSimulator.init();
      this.applySession(this.session);
      this.startVideoStream(await window.ciderSimulator.getStreamUrl());
    } catch (error) {
      this.showError(error);
    }
  }

  private bindEvents() {
    this.stage.addEventListener("pointerdown", (event) => {
      if (!this.session) {
        return;
      }
      this.pointerStart = this.eventToPoint(event);
    });

    this.stage.addEventListener("pointerup", async (event) => {
      if (!this.session || !this.pointerStart || !window.ciderSimulator) {
        return;
      }

      const endPoint = this.eventToPoint(event);
      const startPoint = this.pointerStart;
      this.pointerStart = null;
      const distance = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);

      try {
        if (distance < this.movementThreshold) {
          await window.ciderSimulator.tap(startPoint.x, startPoint.y);
        } else {
          await window.ciderSimulator.swipe(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
        }
      } catch (error) {
        this.showError(error);
      }
    });

    this.stage.addEventListener("pointerleave", () => {
      this.pointerStart = null;
    });

    document.addEventListener("keydown", (event) => {
      if (!this.session || !window.ciderSimulator) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key.length === 1) {
        this.queueText(event.key);
        return;
      }

      if (event.key === "Enter") {
        this.queueText("\n");
      }

      if (event.key === "Tab") {
        event.preventDefault();
        this.queueText("\t");
      }
    });

    window.addEventListener("resize", () => {
      if (this.session) {
        this.applySession(this.session);
      }
    });
  }

  private applySession(session: SimulatorSessionInfo) {
    document.title = `${session.deviceName} · ${session.sandboxId}`;
    fitStage(this.stage, session.pointWidth, session.pointHeight);
  }

  private startVideoStream(wsUrl: string) {
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as { data: string; format: string };
        if (msg.data) {
          this.deviceImage.src = `data:image/jpeg;base64,${msg.data}`;
          this.loading.dataset.visible = "false";
        }
      } catch {}
    };
    ws.onerror = () => this.showError(new Error("Video stream connection failed"));
    ws.onclose = () => {
      // Attempt reconnect after 1s if session is still active
      if (this.session) {
        setTimeout(() => this.startVideoStream(wsUrl), 1000);
      }
    };
  }

  private eventToPoint(event: PointerEvent): DevicePoint {
    if (!this.session) {
      throw new Error("Simulator session not ready");
    }

    const bounds = this.deviceImage.getBoundingClientRect();
    const xRatio = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const yRatio = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);

    return {
      x: Math.round(xRatio * this.session.pointWidth),
      y: Math.round(yRatio * this.session.pointHeight),
    };
  }

  private queueText(text: string) {
    this.pendingText += text;

    if (this.textFlushTimer !== null) {
      window.clearTimeout(this.textFlushTimer);
    }

    this.textFlushTimer = window.setTimeout(() => {
      void this.flushQueuedText();
    }, 90);
  }

  private async flushQueuedText() {
    if (!window.ciderSimulator) return;
    const text = this.pendingText;
    this.pendingText = "";
    this.textFlushTimer = null;
    if (!text) return;
    try {
      await window.ciderSimulator.inputText(text);
    } catch (error) {
      this.showError(error);
    }
  }

  private showError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    this.loading.textContent = message;
    this.loading.dataset.visible = "true";
  }
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }
  return element as T;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function fitStage(stage: HTMLDivElement, pointWidth: number, pointHeight: number) {
  const availableWidth = Math.max(1, window.innerWidth);
  const availableHeight = Math.max(1, window.innerHeight);
  const scale = Math.min(availableWidth / pointWidth, availableHeight / pointHeight);

  stage.style.width = `${Math.floor(pointWidth * scale)}px`;
  stage.style.height = `${Math.floor(pointHeight * scale)}px`;
}

void new CiderSimulatorApp().init();
