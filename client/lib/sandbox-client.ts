import type {
  SandboxStatus,
  ExecResult,
  FileResult,
  DirectoryListing,
  ProjectResult,
} from "./types";

/**
 * Typed client for the MacBook sandbox API.
 * All calls go through /api/sandbox proxy to avoid CORS.
 */

const PROXY_BASE = "/api/sandbox";

async function post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${PROXY_BASE}?endpoint=${encodeURIComponent(endpoint)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Sandbox error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${PROXY_BASE}?endpoint=${encodeURIComponent(endpoint)}`);
  if (!res.ok) {
    throw new Error(`Sandbox error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const sandbox = {
  status: () => get<SandboxStatus>("/status"),

  exec: (command: string, cwd?: string) =>
    post<ExecResult>("/exec", { command, cwd }),

  writeFile: (path: string, content: string) =>
    post<FileResult>("/files/write", { path, content }),

  readFile: (path: string) =>
    post<FileResult>("/files/read", { path }),

  listFiles: (path: string = ".", recursive: boolean = false) =>
    post<DirectoryListing>("/files/list", { path, recursive }),

  mkdir: (path: string) =>
    post<FileResult>("/files/mkdir", { path }),

  screenshotUrl: () => `${PROXY_BASE}?endpoint=${encodeURIComponent("/screenshot")}`,

  bootSimulator: (deviceName?: string) =>
    post<{ status: string; udid: string; name: string }>("/simulator/boot", {
      device_name: deviceName,
    }),

  createProject: (name: string) =>
    post<ProjectResult>("/project/create", { name }),

  /** WebSocket URL for streaming exec (connects directly to sandbox, not proxied) */
  wsExecUrl: (sandboxUrl: string) =>
    `${sandboxUrl.replace(/^http/, "ws")}/ws/exec`,
};
