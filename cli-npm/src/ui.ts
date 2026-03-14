const Reset = "\x1b[0m";
const Bold = "\x1b[1m";
const Dim = "\x1b[2m";
const Orange = "\x1b[38;5;208m";
const Green = "\x1b[32m";
const Red = "\x1b[31m";
const Cyan = "\x1b[36m";
const Yellow = "\x1b[33m";

export const ui = {
  brand: (s: string) => `${Orange}${s}${Reset}`,
  success: (s: string) => `${Green}${s}${Reset}`,
  error: (s: string) => `${Red}${s}${Reset}`,
  info: (s: string) => `${Cyan}${s}${Reset}`,
  dim: (s: string) => `${Dim}${s}${Reset}`,
  bold: (s: string) => `${Bold}${s}${Reset}`,

  banner() {
    console.log();
    console.log(`${Orange}${Bold}  🍺 Cider${Reset}`);
    console.log(`${Dim}  Brew iOS apps in the cloud${Reset}`);
    console.log();
  },

  kv(key: string, value: string) {
    console.log(`  ${Dim}${key}:${Reset} ${value}`);
  },

  done(msg: string) {
    process.stderr.write(`\x1b[2K\r  ${Green}✓${Reset} ${msg}\n`);
  },

  fatal(msg: string): never {
    console.error(`\n  ${Red}✗${Reset} ${msg}\n`);
    process.exit(1);
  },
};
