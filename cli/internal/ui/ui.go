package ui

import (
	"fmt"
	"os"
)

// ANSI color codes
const (
	Reset  = "\033[0m"
	Bold   = "\033[1m"
	Dim    = "\033[2m"
	Orange = "\033[38;5;208m"
	Green  = "\033[32m"
	Red    = "\033[31m"
	Cyan   = "\033[36m"
	Yellow = "\033[33m"
)

func Brand(s string) string  { return Orange + s + Reset }
func Success(s string) string { return Green + s + Reset }
func Error(s string) string   { return Red + s + Reset }
func Info(s string) string    { return Cyan + s + Reset }
func Dimmed(s string) string  { return Dim + s + Reset }

func Banner() {
	fmt.Println()
	fmt.Println(Orange + Bold + "  🍺 Cider" + Reset)
	fmt.Println(Dim + "  Brew iOS apps in the cloud" + Reset)
	fmt.Println()
}

func KeyValue(key, value string) {
	fmt.Printf("  %s%s:%s %s\n", Dim, key, Reset, value)
}

func Spinner(msg string) {
	fmt.Fprintf(os.Stderr, "%s  %s%s\r", Yellow+"⠋"+Reset, msg, Reset)
}

func ClearLine() {
	fmt.Fprintf(os.Stderr, "\r\033[K")
}

func Fatal(msg string) {
	fmt.Fprintf(os.Stderr, "\n  %s %s\n\n", Error("✗"), msg)
	os.Exit(1)
}

func Done(msg string) {
	ClearLine()
	fmt.Fprintf(os.Stderr, "  %s %s\n", Success("✓"), msg)
}
