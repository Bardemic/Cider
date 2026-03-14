package cmd

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"

	"github.com/Bardemic/Cider/cli/internal/agent"
	"github.com/Bardemic/Cider/cli/internal/api"
	"github.com/Bardemic/Cider/cli/internal/config"
	"github.com/Bardemic/Cider/cli/internal/ui"
)

func Execute() {
	if len(os.Args) < 2 {
		printUsage()
		return
	}

	cfg := config.Load()
	cmd := os.Args[1]

	switch cmd {
	case "create":
		cmdCreate(cfg)
	case "list", "ls":
		cmdList(cfg)
	case "stop", "delete":
		if len(os.Args) < 3 {
			ui.Fatal("Usage: cider stop <ID>")
		}
		cmdStop(cfg, os.Args[2])
	case "login":
		cmdLogin(cfg)
	case "google":
		if len(os.Args) >= 3 && os.Args[2] == "login" {
			cmdGoogleLogin(cfg)
		} else {
			printUsage()
		}
	case "status":
		cmdStatus(cfg)
	case "help", "--help", "-h":
		printUsage()
	case "version", "--version", "-v":
		fmt.Println("cider v0.2.0")
	default:
		// Treat as sandbox ID: cider <ID> --emulator ios | --google
		cmdSandboxAction(cfg, cmd)
	}
}

func cmdCreate(cfg *config.Config) {
	var repo string
	for i, arg := range os.Args[2:] {
		if arg == "--repo" && i+3 < len(os.Args) {
			repo = os.Args[i+3]
		}
	}

	client := api.New(cfg.APIUrl)

	fmt.Println()
	if repo != "" {
		fmt.Printf("  %s Creating sandbox with repo %s...\n", ui.Yellow+"⠋"+ui.Reset, ui.Dimmed(repo))
	} else {
		fmt.Printf("  %s Creating sandbox...\n", ui.Yellow+"⠋"+ui.Reset)
	}

	sandbox, err := client.CreateSandbox(repo)
	if err != nil {
		ui.Fatal(fmt.Sprintf("Failed to create sandbox: %s", err))
	}

	cfg.ActiveSandbox = sandbox.ID
	cfg.Save()

	ui.ClearLine()
	ui.Done("Sandbox ready")
	fmt.Println()
	ui.KeyValue("ID", ui.Brand(sandbox.ID))
	ui.KeyValue("VM", sandbox.VMName)
	ui.KeyValue("IP", sandbox.IP)
	ui.KeyValue("Status", ui.Success(sandbox.Status))

	fmt.Println()
	fmt.Printf("  %s\n", ui.Dimmed("Next steps:"))
	fmt.Printf("  %s\n", ui.Dimmed(fmt.Sprintf("  cider %s --emulator ios    # boot iOS simulator", sandbox.ID)))
	fmt.Printf("  %s\n", ui.Dimmed(fmt.Sprintf("  cider %s --google          # start Gemini agent", sandbox.ID)))
	fmt.Printf("  %s\n", ui.Dimmed(fmt.Sprintf("  cider stop %s              # stop and delete", sandbox.ID)))
	fmt.Println()
}

func cmdList(cfg *config.Config) {
	client := api.New(cfg.APIUrl)

	sandboxes, err := client.ListSandboxes()
	if err != nil {
		ui.Fatal(fmt.Sprintf("Failed to list sandboxes: %s", err))
	}

	fmt.Println()
	if len(sandboxes) == 0 {
		fmt.Printf("  %s\n\n", ui.Dimmed("No sandboxes. Run: cider create"))
		return
	}

	fmt.Printf("  %s%s%-14s %-22s %-16s %-10s %s%s\n",
		ui.Bold, ui.Dim, "ID", "VM", "IP", "STATUS", "CREATED", ui.Reset)
	for _, s := range sandboxes {
		var statusColor string
		switch s.Status {
		case "running":
			statusColor = ui.Success(s.Status)
		case "creating":
			statusColor = ui.Info(s.Status)
		case "error":
			statusColor = ui.Error(s.Status)
		default:
			statusColor = ui.Dimmed(s.Status)
		}

		ip := s.IP
		if ip == "" {
			ip = "-"
		}
		fmt.Printf("  %-14s %-22s %-16s %-10s %s\n",
			ui.Brand(s.ID), s.VMName, ip, statusColor, ui.Dimmed(s.CreatedAt))
	}
	fmt.Println()
}

func cmdStop(cfg *config.Config, id string) {
	client := api.New(cfg.APIUrl)

	fmt.Printf("\n  Stopping sandbox %s...\n", ui.Brand(id))

	err := client.DeleteSandbox(id)
	if err != nil {
		ui.Fatal(fmt.Sprintf("Failed to stop sandbox: %s", err))
	}

	// Clear active sandbox if it was this one
	if cfg.ActiveSandbox == id {
		cfg.ActiveSandbox = ""
		cfg.Save()
	}

	ui.Done(fmt.Sprintf("Sandbox %s stopped and deleted", id))
	fmt.Println()
}

func cmdLogin(cfg *config.Config) {
	dashboardURL := os.Getenv("CIDER_DASHBOARD_URL")
	if dashboardURL == "" {
		dashboardURL = "http://localhost:3000"
	}
	loginURL := dashboardURL + "/login"

	fmt.Println()
	fmt.Printf("  Opening %s...\n\n", ui.Brand(loginURL))

	var openCmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		openCmd = exec.Command("open", loginURL)
	case "windows":
		openCmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", loginURL)
	default:
		openCmd = exec.Command("xdg-open", loginURL)
	}

	if err := openCmd.Start(); err != nil {
		fmt.Printf("  %s Visit manually: %s\n\n", ui.Dimmed("Could not open browser."), loginURL)
	} else {
		ui.Done("Browser opened. Complete login there, then return here.")
	}
	fmt.Println()
}

func cmdGoogleLogin(cfg *config.Config) {
	fmt.Println()
	fmt.Printf("  %s%sGemini API Authentication%s\n\n", ui.Orange, ui.Bold, ui.Reset)
	fmt.Printf("  %s\n\n", ui.Dimmed("Get your API key at: https://aistudio.google.com/apikey"))

	reader := bufio.NewReader(os.Stdin)
	fmt.Print("  Enter your Gemini API key: ")
	key, _ := reader.ReadString('\n')
	key = strings.TrimSpace(key)

	if key == "" {
		ui.Fatal("No key provided.")
	}

	fmt.Print("  Validating...")

	resp, err := api.New("https://generativelanguage.googleapis.com/v1beta").HTTPClient.Get(
		fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models?key=%s", key),
	)
	if err != nil || resp.StatusCode != 200 {
		ui.ClearLine()
		ui.Fatal("Invalid API key. Check your key and try again.")
	}
	resp.Body.Close()

	cfg.GeminiAPIKey = key
	if err := cfg.Save(); err != nil {
		ui.Fatal(fmt.Sprintf("Failed to save config: %s", err))
	}

	ui.ClearLine()
	ui.Done("API key saved")
	fmt.Printf("  %s\n\n", ui.Dimmed("Stored in ~/.cider/config.json"))
}

func cmdStatus(cfg *config.Config) {
	client := api.New(cfg.APIUrl)

	ui.Banner()
	ui.KeyValue("Host", cfg.APIUrl)

	// Try to reach the host server
	sandboxes, err := client.ListSandboxes()
	if err != nil {
		fmt.Printf("  %s %s\n", ui.Error("✗"), fmt.Sprintf("Cannot reach host at %s", cfg.APIUrl))
		fmt.Printf("  %s\n\n", ui.Dimmed(err.Error()))
		return
	}

	ui.Done(fmt.Sprintf("Connected — %d sandbox(es)", len(sandboxes)))

	if cfg.GeminiAPIKey != "" {
		ui.KeyValue("Gemini", ui.Success("configured"))
	} else {
		ui.KeyValue("Gemini", ui.Dimmed("not configured — run: cider google login"))
	}

	if cfg.ActiveSandbox != "" {
		ui.KeyValue("Active", ui.Brand(cfg.ActiveSandbox))
	}
	fmt.Println()
}

func cmdSandboxAction(cfg *config.Config, id string) {
	if len(os.Args) < 3 {
		fmt.Printf("\n  %s\n\n", ui.Dimmed("Usage: cider <ID> --emulator ios | --google"))
		return
	}

	client := api.New(cfg.APIUrl)
	flag := os.Args[2]

	switch flag {
	case "--emulator":
		device := "iPhone 16"
		if len(os.Args) >= 4 && os.Args[3] != "" {
			if os.Args[3] != "ios" {
				device = os.Args[3]
			}
		}

		fmt.Printf("\n  Booting %s in sandbox %s...\n", device, ui.Brand(id))
		result, err := client.BootSimulator(id, device)
		if err != nil {
			ui.Fatal(fmt.Sprintf("Failed to boot simulator: %s", err))
		}

		status, _ := result["status"].(string)
		if status == "already_booted" {
			ui.Done(fmt.Sprintf("%s already running", device))
		} else {
			ui.Done(fmt.Sprintf("%s booted", device))
		}
		fmt.Println()

	case "--google":
		geminiKey := cfg.GeminiAPIKey
		if geminiKey == "" {
			ui.Fatal("Gemini not configured. Run: cider google login")
		}

		ui.Banner()
		fmt.Printf("  %s %s\n", ui.Dimmed("Sandbox:"), ui.Brand(id))
		fmt.Printf("  %s\n", ui.Dimmed("Type your prompt. The agent will build your iOS app."))
		fmt.Printf("  %s\n\n", ui.Dimmed("Type 'exit' to quit."))

		reader := bufio.NewReader(os.Stdin)
		for {
			fmt.Printf("  %s> %s", ui.Orange, ui.Reset)
			prompt, _ := reader.ReadString('\n')
			prompt = strings.TrimSpace(prompt)

			if prompt == "" {
				continue
			}
			if prompt == "exit" || prompt == "quit" {
				fmt.Println()
				return
			}

			a := agent.New(geminiKey, client, id)
			if err := a.Run(prompt); err != nil {
				fmt.Printf("\n  %s %s\n\n", ui.Error("✗"), err)
			} else {
				fmt.Printf("\n  %s\n\n", ui.Success("✓ Agent finished"))
			}
		}

	default:
		fmt.Printf("  Unknown flag: %s\n", flag)
		fmt.Printf("  %s\n\n", ui.Dimmed("Usage: cider <ID> --emulator ios | --google"))
	}
}

func printUsage() {
	ui.Banner()
	fmt.Println("  " + ui.Bold + "Usage:" + ui.Reset)
	fmt.Println()
	fmt.Println("    cider create                      Create a new sandbox (Tart VM)")
	fmt.Println("    cider create --repo <url>          Create sandbox with repo cloned")
	fmt.Println("    cider list                         List your sandboxes")
	fmt.Println("    cider status                       Check host server connection")
	fmt.Println("    cider login                        Open dashboard login in browser")
	fmt.Println("    cider google login                 Authenticate with Gemini API key")
	fmt.Println("    cider <ID> --emulator ios           Boot iOS simulator in sandbox")
	fmt.Println("    cider <ID> --google                 Start Gemini agent session")
	fmt.Println("    cider stop <ID>                    Stop and delete a sandbox")
	fmt.Println()
}
