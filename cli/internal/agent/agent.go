package agent

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/Bardemic/Cider/cli/internal/api"
	"github.com/Bardemic/Cider/cli/internal/ui"
)

const (
	geminiModel   = "gemini-2.5-pro-preview-05-06"
	maxIterations = 20
)

const systemPrompt = `You are Cider, an AI agent that builds iOS apps using Xcode on a remote macOS sandbox.

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
- The simulator should already be booted. If not, boot it first.`

// Tool declarations for Gemini
var toolDeclarations = []map[string]any{
	{
		"name":        "create_file",
		"description": "Create or overwrite a file in the Xcode project.",
		"parameters": map[string]any{
			"type": "object",
			"properties": map[string]any{
				"path":    map[string]string{"type": "string", "description": "File path relative to project root"},
				"content": map[string]string{"type": "string", "description": "File contents"},
			},
			"required": []string{"path", "content"},
		},
	},
	{
		"name":        "read_file",
		"description": "Read the contents of a file.",
		"parameters": map[string]any{
			"type": "object",
			"properties": map[string]any{
				"path": map[string]string{"type": "string", "description": "File path relative to project root"},
			},
			"required": []string{"path"},
		},
	},
	{
		"name":        "list_files",
		"description": "List files and directories.",
		"parameters": map[string]any{
			"type": "object",
			"properties": map[string]any{
				"path":      map[string]string{"type": "string", "description": "Directory path (default: '.')"},
				"recursive": map[string]string{"type": "boolean", "description": "List recursively"},
			},
		},
	},
	{
		"name":        "execute_command",
		"description": "Execute a shell command on the macOS sandbox.",
		"parameters": map[string]any{
			"type": "object",
			"properties": map[string]any{
				"command": map[string]string{"type": "string", "description": "Shell command to execute"},
				"cwd":     map[string]string{"type": "string", "description": "Working directory (optional)"},
			},
			"required": []string{"command"},
		},
	},
	{
		"name":        "get_screenshot",
		"description": "Capture a screenshot of the iOS Simulator.",
		"parameters": map[string]any{
			"type":       "object",
			"properties": map[string]any{},
		},
	},
	{
		"name":        "get_sandbox_status",
		"description": "Get system info: macOS version, Xcode version, booted simulators.",
		"parameters": map[string]any{
			"type":       "object",
			"properties": map[string]any{},
		},
	},
	{
		"name":        "create_xcode_project",
		"description": "Create a new Xcode project from the SwiftUI template.",
		"parameters": map[string]any{
			"type": "object",
			"properties": map[string]any{
				"name": map[string]string{"type": "string", "description": "Project name (alphanumeric, no spaces)"},
			},
			"required": []string{"name"},
		},
	},
}

// Gemini API types
type geminiContent struct {
	Role  string        `json:"role"`
	Parts []geminiPart  `json:"parts"`
}

type geminiPart struct {
	Text             string             `json:"text,omitempty"`
	FunctionCall     *geminiFC          `json:"functionCall,omitempty"`
	FunctionResponse *geminiFR          `json:"functionResponse,omitempty"`
}

type geminiFC struct {
	Name string         `json:"name"`
	Args map[string]any `json:"args"`
}

type geminiFR struct {
	Name     string        `json:"name"`
	Response geminiResult  `json:"response"`
}

type geminiResult struct {
	Result string `json:"result"`
}

type geminiRequest struct {
	Contents          []geminiContent  `json:"contents"`
	Tools             []map[string]any `json:"tools"`
	SystemInstruction *geminiContent   `json:"systemInstruction,omitempty"`
	GenerationConfig  map[string]any   `json:"generationConfig,omitempty"`
}

type geminiResponse struct {
	Candidates []struct {
		Content geminiContent `json:"content"`
	} `json:"candidates"`
}

type Agent struct {
	apiKey    string
	sandbox   *api.Client
	sandboxID string
}

func New(geminiAPIKey string, sandbox *api.Client, sandboxID string) *Agent {
	return &Agent{apiKey: geminiAPIKey, sandbox: sandbox, sandboxID: sandboxID}
}

func (a *Agent) Run(prompt string) error {
	contents := []geminiContent{
		{Role: "user", Parts: []geminiPart{{Text: prompt}}},
	}

	for i := 0; i < maxIterations; i++ {
		resp, err := a.callGemini(contents)
		if err != nil {
			return fmt.Errorf("gemini call failed: %w", err)
		}

		contents = append(contents, *resp)

		// Print any text parts
		for _, p := range resp.Parts {
			if p.Text != "" {
				fmt.Printf("\n  %s%s%s\n", ui.Cyan, p.Text, ui.Reset)
			}
		}

		// Collect function calls
		var calls []geminiPart
		for _, p := range resp.Parts {
			if p.FunctionCall != nil {
				calls = append(calls, p)
			}
		}

		if len(calls) == 0 {
			// No tool calls — agent is done
			return nil
		}

		// Execute each tool call
		var responseParts []geminiPart
		for _, call := range calls {
			fc := call.FunctionCall
			fmt.Printf("  %s⚡ %s%s", ui.Orange, fc.Name, ui.Reset)

			// Show relevant arg
			switch fc.Name {
			case "create_file", "read_file":
				if p, ok := fc.Args["path"]; ok {
					fmt.Printf(" %s%v%s", ui.Dim, p, ui.Reset)
				}
			case "execute_command":
				if cmd, ok := fc.Args["command"]; ok {
					s := fmt.Sprintf("%v", cmd)
					if len(s) > 80 {
						s = s[:80] + "..."
					}
					fmt.Printf(" %s$ %s%s", ui.Dim, s, ui.Reset)
				}
			case "create_xcode_project":
				if n, ok := fc.Args["name"]; ok {
					fmt.Printf(" %s%v%s", ui.Dim, n, ui.Reset)
				}
			}
			fmt.Println()

			result, err := a.executeTool(fc.Name, fc.Args)
			if err != nil {
				result = fmt.Sprintf(`{"error": "%s"}`, err.Error())
				fmt.Printf("  %s✗ %s%s\n", ui.Red, err.Error(), ui.Reset)
			} else {
				fmt.Printf("  %s✓ done%s\n", ui.Green, ui.Reset)
			}

			responseParts = append(responseParts, geminiPart{
				FunctionResponse: &geminiFR{
					Name:     fc.Name,
					Response: geminiResult{Result: result},
				},
			})
		}

		contents = append(contents, geminiContent{
			Role:  "user",
			Parts: responseParts,
		})
	}

	return fmt.Errorf("agent reached maximum iterations (%d)", maxIterations)
}

func (a *Agent) executeTool(name string, args map[string]any) (string, error) {
	var result any
	var err error

	str := func(key string) string {
		if v, ok := args[key]; ok {
			return fmt.Sprintf("%v", v)
		}
		return ""
	}

	id := a.sandboxID

	switch name {
	case "create_file":
		result, err = a.sandbox.WriteFile(id, str("path"), str("content"))
	case "read_file":
		result, err = a.sandbox.ReadFile(id, str("path"))
	case "list_files":
		recursive := false
		if v, ok := args["recursive"]; ok {
			if b, ok := v.(bool); ok {
				recursive = b
			}
		}
		result, err = a.sandbox.ListFiles(id, str("path"), recursive)
	case "execute_command":
		result, err = a.sandbox.Exec(id, str("command"), str("cwd"))
	case "get_screenshot":
		_, err = a.sandbox.Screenshot(id)
		if err == nil {
			result = map[string]string{"screenshot": "captured", "note": "Screenshot captured successfully."}
		}
	case "get_sandbox_status":
		result, err = a.sandbox.SandboxStatus(id)
	case "create_xcode_project":
		result, err = a.sandbox.CreateProject(id, str("name"))
	default:
		return "", fmt.Errorf("unknown tool: %s", name)
	}

	if err != nil {
		return "", err
	}

	data, err := json.Marshal(result)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (a *Agent) callGemini(contents []geminiContent) (*geminiContent, error) {
	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
		geminiModel, a.apiKey,
	)

	reqBody := geminiRequest{
		Contents: contents,
		Tools: []map[string]any{
			{"functionDeclarations": toolDeclarations},
		},
		SystemInstruction: &geminiContent{
			Parts: []geminiPart{{Text: systemPrompt}},
		},
		GenerationConfig: map[string]any{
			"temperature":    0.2,
			"maxOutputTokens": 8192,
		},
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(url, "application/json", bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Gemini API error %d: %s", resp.StatusCode, string(body))
	}

	var geminiResp geminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	if len(geminiResp.Candidates) == 0 {
		return nil, fmt.Errorf("no response from Gemini")
	}

	return &geminiResp.Candidates[0].Content, nil
}
