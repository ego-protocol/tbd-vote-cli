import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Config } from "../types.js";

export function getConfigDir(): string {
  return process.env.TBD_CONFIG_DIR || path.join(os.homedir(), ".tbd");
}

function getConfigFile(): string {
  return path.join(getConfigDir(), "config.json");
}

const DEFAULTS: Config = {
  "api-url": "https://production-tbd-bets-api.tbd.vote",
  "api-key": null,
  "bet-size": "1.00",
  "default-status": "open",
  "default-limit": "20",
};

export function getConfig(): Config {
  try {
    const raw = fs.readFileSync(getConfigFile(), "utf-8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setConfig(key: keyof Config, value: string | null): void {
  const config = getConfig();
  (config as Record<string, string | null>)[key] = value;
  ensureConfigDir();
  fs.writeFileSync(getConfigFile(), JSON.stringify(config, null, 2) + "\n");
}

export function getConfigValue(key: keyof Config): string | null {
  const config = getConfig();
  return config[key] ?? DEFAULTS[key] ?? null;
}

export function removeConfigValue(key: keyof Config): void {
  const config = getConfig();
  (config as Record<string, string | null>)[key] = null;
  ensureConfigDir();
  fs.writeFileSync(getConfigFile(), JSON.stringify(config, null, 2) + "\n");
}

function ensureConfigDir(): void {
  fs.mkdirSync(getConfigDir(), { recursive: true });
}
