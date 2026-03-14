import { ApiClient } from "./api.js";
import { ui } from "./ui.js";

const GEMINI_MODEL = "gemini-2.5-pro-preview-05-06";
const MAX_ITERATIONS = 20;

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
- If you need additional Swift files, create them in the existing source directory — they will be auto-discovered by Xcode.
- Keep the app simple and focused on what the user asked for.
- If a build fails, carefully read the errors and fix them. You may need 2-3 attempts.
- Use SwiftUI for all UI code.
- The simulator should already be booted. If not, boot it first.`;

const TOOL_DECLARATIONS = [
  {
    name: "create_file",
    description: "Create or overwrite a file in the Xcode project.",
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
    },
  },
  {
    name: "execute_command",
    description: "Execute a shell command on the macOS sandbox.",
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
    description: "Capture a screenshot of the iOS Simulator.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_sandbox_status",
    description: "Get system info: macOS version, Xcode version, booted simulators.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "create_xcode_project",
    description: "Create a new Xcode project from the SwiftUI template.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name (alphanumeric, no spaces)" },
      },
      required: ["name"],
    },
  },
];

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: { result: string } } };

export async function runAgent(
  apiKey: string,
  client: ApiClient,
  sandboxId: string,
  prompt: string
): Promise<void> {
  const contents: GeminiContent[] = [
    { role: "user", parts: [{ text: prompt }] },
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await callGemini(apiKey, contents);
    contents.push(response);

    // Print text parts
    for (const p of response.parts) {
      if ("text" in p && p.text) {
        console.log(`\n  \x1b[36m${p.text}\x1b[0m`);
      }
    }

    // Collect function calls
    const calls = response.parts.filter(
      (p): p is { functionCall: { name: string; args: Record<string, unknown> } } =>
        "functionCall" in p
    );

    if (calls.length === 0) return;

    // Execute tools
    const responseParts: GeminiPart[] = [];
    for (const call of calls) {
      const { name, args } = call.functionCall;
      const argStr = (key: string) => String(args[key] ?? "");

      // Print tool call
      let detail = "";
      if (name === "create_file" || name === "read_file") detail = ` ${ui.dim(argStr("path"))}`;
      else if (name === "execute_command") {
        const cmd = argStr("command");
        detail = ` ${ui.dim("$ " + (cmd.length > 80 ? cmd.slice(0, 80) + "..." : cmd))}`;
      } else if (name === "create_xcode_project") detail = ` ${ui.dim(argStr("name"))}`;
      else if (name === "list_files") detail = ` ${ui.dim(argStr("path") || ".")}`;
      console.log(`  \x1b[38;5;208m⚡ ${name}\x1b[0m${detail}`);

      let result: string;
      try {
        result = await executeTool(client, sandboxId, name, args);
        console.log(`  \x1b[32m✓ done\x1b[0m`);
      } catch (err) {
        result = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
        console.log(`  \x1b[31m✗ ${err instanceof Error ? err.message : err}\x1b[0m`);
      }

      responseParts.push({
        functionResponse: { name, response: { result } },
      });
    }

    contents.push({ role: "user", parts: responseParts });
  }

  throw new Error(`Agent reached maximum iterations (${MAX_ITERATIONS})`);
}

async function executeTool(
  client: ApiClient,
  id: string,
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const str = (key: string) => String(args[key] ?? "");
  let result: unknown;

  switch (name) {
    case "create_file":
      result = await client.writeFile(id, str("path"), str("content"));
      break;
    case "read_file":
      result = await client.readFile(id, str("path"));
      break;
    case "list_files":
      result = await client.listFiles(id, str("path") || ".", Boolean(args.recursive));
      break;
    case "execute_command":
      result = await client.exec(id, str("command"), str("cwd") || undefined);
      break;
    case "get_screenshot":
      await client.screenshot(id);
      result = { screenshot: "captured", note: "Screenshot captured successfully." };
      break;
    case "get_sandbox_status":
      result = await client.sandboxStatus(id);
      break;
    case "create_xcode_project":
      result = await client.createProject(id, str("name"));
      break;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return JSON.stringify(result, null, 2);
}

async function callGemini(apiKey: string, contents: GeminiContent[]): Promise<GeminiContent> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const candidate = (data as { candidates?: { content: GeminiContent }[] }).candidates?.[0];
  if (!candidate?.content) throw new Error("No response from Gemini");
  return candidate.content;
}
