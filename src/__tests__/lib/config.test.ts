import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getConfig, setConfig, getConfigValue, removeConfigValue } from "../../lib/config.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tbd-cli-test-"));
  process.env.TBD_CONFIG_DIR = tmpDir;
});

afterEach(() => {
  delete process.env.TBD_CONFIG_DIR;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("getConfig", () => {
  it("returns defaults when no config file exists", () => {
    const config = getConfig();
    expect(config["api-url"]).toBe("https://production-tbd-bets-api.tbd.vote");
    expect(config["api-key"]).toBeNull();
    expect(config["bet-size"]).toBe("1.00");
    expect(config["default-status"]).toBe("open");
    expect(config["default-limit"]).toBe("20");
  });

  it("merges file values with defaults", () => {
    fs.writeFileSync(
      path.join(tmpDir, "config.json"),
      JSON.stringify({ "bet-size": "5.00" }),
    );
    const config = getConfig();
    expect(config["bet-size"]).toBe("5.00");
    expect(config["api-url"]).toBe("https://production-tbd-bets-api.tbd.vote");
  });
});

describe("setConfig", () => {
  it("creates dir and file, persists value", () => {
    const nestedDir = path.join(tmpDir, "nested");
    process.env.TBD_CONFIG_DIR = nestedDir;

    setConfig("bet-size", "2.50");

    const raw = fs.readFileSync(path.join(nestedDir, "config.json"), "utf-8");
    const parsed = JSON.parse(raw);
    expect(parsed["bet-size"]).toBe("2.50");
  });

  it("preserves other keys when updating one", () => {
    setConfig("bet-size", "3.00");
    setConfig("default-status", "ended");

    const config = getConfig();
    expect(config["bet-size"]).toBe("3.00");
    expect(config["default-status"]).toBe("ended");
  });
});

describe("getConfigValue", () => {
  it("returns set value", () => {
    setConfig("bet-size", "7.77");
    expect(getConfigValue("bet-size")).toBe("7.77");
  });

  it("returns default for unset key", () => {
    expect(getConfigValue("default-limit")).toBe("20");
  });
});

describe("removeConfigValue", () => {
  it("sets key to null", () => {
    setConfig("api-key", "tbd_api_test123");
    expect(getConfigValue("api-key")).toBe("tbd_api_test123");

    removeConfigValue("api-key");
    expect(getConfigValue("api-key")).toBeNull();
  });
});

describe("config file format", () => {
  it("writes valid JSON", () => {
    setConfig("bet-size", "1.50");
    const raw = fs.readFileSync(path.join(tmpDir, "config.json"), "utf-8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
