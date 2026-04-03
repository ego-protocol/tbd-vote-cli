import { Command } from "commander";
import { getConfig, setConfig, getConfigValue } from "../lib/config.js";
import { printSuccess, printError } from "../lib/output.js";
import type { Config } from "../types.js";

const ALLOWED_KEYS = [
  "api-url",
  "bet-size",
  "default-status",
  "default-limit",
  "max-bet-per-campaign",
] as const;

function isAllowedKey(key: string): key is (typeof ALLOWED_KEYS)[number] {
  return (ALLOWED_KEYS as readonly string[]).includes(key);
}

export function registerConfig(program: Command): void {
  const config = program
    .command("config")
    .description("Manage CLI configuration");

  config
    .command("set")
    .description("Set a configuration value")
    .argument("<key>", "Config key")
    .argument("<value>", "Config value")
    .action((key: string, value: string) => {
      const jsonMode = program.opts().json ?? false;

      if (key === "api-key") {
        printError(
          new Error(
            "Use 'tbd-vote login' to set the API key, not 'config set'.",
          ),
          jsonMode,
        );
        return;
      }

      if (!isAllowedKey(key)) {
        printError(
          new Error(
            `Unknown config key: ${key}\nAllowed keys: ${ALLOWED_KEYS.join(", ")}`,
          ),
          jsonMode,
        );
        return;
      }

      setConfig(key, value);

      printSuccess(
        jsonMode
          ? { status: "ok", key, value }
          : `Set ${key} = ${value}`,
        jsonMode,
      );
    });

  config
    .command("get")
    .description("Get a configuration value")
    .argument("<key>", "Config key")
    .action((key: string) => {
      const jsonMode = program.opts().json ?? false;
      const value = getConfigValue(key as keyof Config);

      if (jsonMode) {
        printSuccess({ key, value }, true);
      } else {
        printSuccess(value ?? "(not set)", false);
      }
    });

  config
    .command("list")
    .description("List all configuration values")
    .action(() => {
      const jsonMode = program.opts().json ?? false;
      const cfg = getConfig();

      if (jsonMode) {
        const masked = { ...cfg };
        if (masked["api-key"]) {
          masked["api-key"] =
            masked["api-key"].slice(0, 10) +
            "..." +
            masked["api-key"].slice(-4);
        }
        printSuccess(masked, true);
      } else {
        const entries: [string, string][] = Object.entries(cfg).map(
          ([k, v]) => {
            if (k === "api-key" && v) {
              return [k, v.slice(0, 10) + "..." + v.slice(-4)];
            }
            return [k, v ?? "(not set)"];
          },
        );

        const maxKeyLen = Math.max(...entries.map(([k]) => k.length));
        const lines = entries
          .map(([k, v]) => `${k.padEnd(maxKeyLen)}  ${v}`)
          .join("\n");
        printSuccess(lines, false);
      }
    });
}
