import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Config } from "../types.js";
import { API_BASE_URL, DEFAULT_BET_SIZE, DEFAULT_MAX_BET_PER_CAMPAIGN } from "./constants.js";

export function getConfigDir(): string {
  return process.env.TBD_CONFIG_DIR || path.join(os.homedir(), ".tbd");
}

function getConfigFile(): string {
  return path.join(getConfigDir(), "config.json");
}

const DEFAULTS: Config = {
  "api-url": API_BASE_URL,
  "api-key": null,
  "bet-size": DEFAULT_BET_SIZE,
  "default-status": "open",
  "default-limit": "20",
  "max-bet-per-campaign": DEFAULT_MAX_BET_PER_CAMPAIGN,
};

export function getConfig(): Config {
  try {
    const raw = fs.readFileSync(getConfigFile(), "utf-8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setConfig<K extends keyof Config>(key: K, value: Config[K]): void {
  const config = getConfig();
  const updatedConfig = { ...config };
  updatedConfig[key] = value;
  ensureConfigDir();
  fs.writeFileSync(getConfigFile(), JSON.stringify(updatedConfig, null, 2) + "\n");
}

export function getConfigValue(key: keyof Config): string | null {
  const config = getConfig();
  return config[key] ?? DEFAULTS[key] ?? null;
}

type NullableConfigKey = {
  [K in keyof Config]: null extends Config[K] ? K : never;
}[keyof Config];

export function removeConfigValue(key: NullableConfigKey): void {
  const config = getConfig();
  const updatedConfig = { ...config };
  updatedConfig[key] = null;
  ensureConfigDir();
  fs.writeFileSync(getConfigFile(), JSON.stringify(updatedConfig, null, 2) + "\n");
}

function ensureConfigDir(): void {
  fs.mkdirSync(getConfigDir(), { recursive: true });
}
