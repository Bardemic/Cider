export interface SandboxInfo {
  id: string;
  user_id?: string;
  vm_name: string;
  ip?: string;
  status: string;
  created_at: string;
}

export interface SandboxStatus {
  platform: string;
  macos_version: string;
  xcode: string;
  booted_simulators: { name: string; udid: string }[];
  disk: string;
  project_root: string;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exit_code: number;
}

export interface FileResult {
  path: string;
  content?: string;
  size?: number;
  error?: string;
}

export interface DirListing {
  path: string;
  entries: { path: string; type: string; size: number | null }[];
  error?: string;
}

export interface ProjectResult {
  path: string;
  name: string;
  error?: string;
}

export class ApiClient {
  constructor(private baseUrl: string) {}

  // --- Sandbox lifecycle ---

  async createSandbox(repo?: string): Promise<SandboxInfo> {
    return this.post("/sandboxes", repo ? { repo } : {});
  }

  async listSandboxes(): Promise<SandboxInfo[]> {
    return this.get("/sandboxes");
  }

  async getSandbox(id: string): Promise<SandboxInfo> {
    return this.get(`/sandboxes/${id}`);
  }

  async deleteSandbox(id: string): Promise<void> {
    await this.del(`/sandboxes/${id}`);
  }

  // --- Per-sandbox operations ---

  async sandboxStatus(id: string): Promise<SandboxStatus> {
    return this.get(`/sandboxes/${id}/status`);
  }

  async exec(id: string, command: string, cwd?: string): Promise<ExecResult> {
    const body: Record<string, string> = { command };
    if (cwd) body.cwd = cwd;
    return this.post(`/sandboxes/${id}/exec`, body);
  }

  async writeFile(id: string, path: string, content: string): Promise<FileResult> {
    return this.post(`/sandboxes/${id}/files/write`, { path, content });
  }

  async readFile(id: string, path: string): Promise<FileResult> {
    return this.post(`/sandboxes/${id}/files/read`, { path });
  }

  async listFiles(id: string, path: string = ".", recursive = false): Promise<DirListing> {
    return this.post(`/sandboxes/${id}/files/list`, { path, recursive });
  }

  async createProject(id: string, name: string): Promise<ProjectResult> {
    return this.post(`/sandboxes/${id}/project/create`, { name });
  }

  async bootSimulator(id: string, device?: string): Promise<Record<string, unknown>> {
    return this.post(`/sandboxes/${id}/simulator/boot`, device ? { device_name: device } : {});
  }

  async screenshot(id: string): Promise<Buffer> {
    const res = await fetch(`${this.baseUrl}/sandboxes/${id}/screenshot`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  // --- HTTP helpers ---

  private async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  private async post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  private async del(endpoint: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
  }
}
