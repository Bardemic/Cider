/**
 * Gemini 2.5 Pro agent with function calling.
 * Runs server-side in the API route. Streams AgentEvents via callback.
 */

const GEMINI_MODEL = "gemini-3-flash-preview";
const MAX_ITERATIONS = 20;

const SANDBOX_URL = process.env.SANDBOX_URL!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

// --- Tool definitions for Gemini function calling ---

const TOOL_DECLARATIONS = [
  {
    name: "create_file",
    description:
      "Create or overwrite a file in the Xcode project. Use paths relative to the project root (e.g., 'MyApp/ContentView.swift').",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to project root" },
        content: { type: "string", description: "File contents" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a file.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to project root" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description: "List files and directories.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path (default: '.')" },
        recursive: { type: "boolean", description: "List recursively" },
      },
      required: [],
    },
  },
  {
    name: "execute_command",
    description:
      "Execute a shell command on the macOS sandbox. Use for xcodebuild, xcrun simctl, swift commands, etc.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Shell command to execute" },
        cwd: { type: "string", description: "Working directory (optional)" },
      },
      required: ["command"],
    },
  },
  {
    name: "get_screenshot",
    description:
      "Capture a screenshot of the iOS Simulator. Returns a description of the current screen.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_sandbox_status",
    description: "Get system info: macOS version, Xcode version, booted simulators, disk space.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "create_xcode_project",
    description:
      "Create a new Xcode project from the SwiftUI template. Returns the project path. The project will have ContentView.swift, App.swift, Models.swift, and a Views/ directory.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name (alphanumeric, no spaces)" },
      },
      required: ["name"],
    },
  },
];

const SYSTEM_PROMPT = `You are Cider, an AI agent that builds iOS apps using Xcode on a remote macOS sandbox.

You have access to a MacBook with Xcode installed. You can create files, execute commands, and build iOS apps.

## Workflow
1. Create an Xcode project using create_xcode_project
2. List the project files to understand the structure
3. Modify Swift files to implement the requested feature
4. Build the project using: xcodebuild -project <ProjectName>.xcodeproj -scheme <ProjectName> -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16' build
5. If there are build errors, read the error output carefully, fix the code, and rebuild
6. Once the build succeeds, install and launch in the simulator:
   - xcrun simctl install booted <path-to-app>
   - xcrun simctl launch booted <bundle-id>
7. Take a screenshot to verify the app looks correct

## Important Rules
- ONLY modify .swift files inside the project source directory. NEVER edit .pbxproj files.
- The template project includes ContentView.swift, App.swift, and a Models.swift file.
- If you need additional Swift files, create them in the existing source directory and add them - they will be auto-discovered by Xcode since they're in the same target directory.
- Keep the app simple and focused on what the user asked for.
- If a build fails, carefully read the errors and fix them. You may need 2-3 attempts.
- Use SwiftUI for all UI code.
- The simulator should already be booted. If not, boot it first.`;

// --- Sandbox API calls ---

async function callSandbox(endpoint: string, body?: Record<string, unknown>): Promise<unknown> {
  const url = `${SANDBOX_URL}${endpoint}`;
  const options: RequestInit = body
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    : { method: "GET" };

  const res = await fetch(url, options);
  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${await res.text()}` };
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("image/")) {
    return { screenshot: "captured", note: "Screenshot captured successfully. The simulator screen has been captured." };
  }
  return res.json();
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  let result: unknown;

  switch (name) {
    case "create_file":
      result = await callSandbox("/files/write", {
        path: args.path as string,
        content: args.content as string,
      });
      break;
    case "read_file":
      result = await callSandbox("/files/read", { path: args.path as string });
      break;
    case "list_files":
      result = await callSandbox("/files/list", {
        path: (args.path as string) || ".",
        recursive: args.recursive ?? false,
      });
      break;
    case "execute_command":
      result = await callSandbox("/exec", {
        command: args.command as string,
        cwd: args.cwd as string | undefined,
      });
      break;
    case "get_screenshot":
      result = await callSandbox("/screenshot");
      break;
    case "get_sandbox_status":
      result = await callSandbox("/status");
      break;
    case "create_xcode_project":
      result = await callSandbox("/project/create", { name: args.name as string });
      break;
    default:
      result = { error: `Unknown tool: ${name}` };
  }

  return JSON.stringify(result, null, 2);
}

// --- Gemini API ---

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: { result: string } } };

async function callGemini(contents: GeminiContent[]): Promise<GeminiContent> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents,
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate?.content) {
    throw new Error("No response from Gemini");
  }
  return candidate.content;
}

// --- Agent loop ---

export type EventCallback = (event: {
  type: "message" | "tool_call" | "tool_result" | "error" | "done";
  data: unknown;
}) => void;

export async function runAgent(userPrompt: string, onEvent: EventCallback): Promise<void> {
  const contents: GeminiContent[] = [
    { role: "user", parts: [{ text: userPrompt }] },
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let response: GeminiContent;
    try {
      response = await callGemini(contents);
    } catch (err) {
      onEvent({
        type: "error",
        data: { message: err instanceof Error ? err.message : String(err) },
      });
      return;
    }

    contents.push(response);

    // Check for function calls
    const functionCalls = response.parts.filter(
      (p): p is { functionCall: { name: string; args: Record<string, unknown> } } =>
        "functionCall" in p
    );

    // Emit any text parts
    for (const part of response.parts) {
      if ("text" in part && part.text) {
        onEvent({
          type: "message",
          data: {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role: "assistant",
            content: part.text,
            timestamp: Date.now(),
          },
        });
      }
    }

    if (functionCalls.length === 0) {
      // No tool calls — agent is done
      const finalText = response.parts
        .filter((p): p is { text: string } => "text" in p)
        .map((p) => p.text)
        .join("\n");
      onEvent({ type: "done", data: { finalMessage: finalText } });
      return;
    }

    // Execute tool calls
    const responseParts: GeminiPart[] = [];
    for (const fc of functionCalls) {
      const { name, args } = fc.functionCall;
      const toolCallId = `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      onEvent({
        type: "tool_call",
        data: { id: toolCallId, name, args, status: "running", timestamp: Date.now() },
      });

      let result: string;
      try {
        result = await executeTool(name, args);
        onEvent({
          type: "tool_result",
          data: { id: toolCallId, name, args, result, status: "success", timestamp: Date.now() },
        });
      } catch (err) {
        result = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
        onEvent({
          type: "tool_result",
          data: { id: toolCallId, name, args, result, status: "error", timestamp: Date.now() },
        });
      }

      responseParts.push({
        functionResponse: { name, response: { result } },
      });
    }

    contents.push({ role: "user", parts: responseParts });
  }

  onEvent({
    type: "error",
    data: { message: `Agent reached maximum iterations (${MAX_ITERATIONS})` },
  });
}
