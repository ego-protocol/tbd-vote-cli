import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const exec = promisify(execFile);
const CLI = path.resolve("dist/index.js");

let tmpDir: string;
let env: NodeJS.ProcessEnv;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tbd-cli-cmd-test-"));
  env = { ...process.env, TBD_CONFIG_DIR: tmpDir };
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function run(...args: string[]) {
  return exec("node", [CLI, ...args], { env });
}

describe("config list", () => {
  it("shows defaults", async () => {
    const { stdout } = await run("config", "list");
    expect(stdout).toContain("api-url");
    expect(stdout).toContain("https://production-tbd-bets-api.tbd.vote");
    expect(stdout).toContain("bet-size");
    expect(stdout).toContain("1.00");
  });

  it("returns valid JSON with --json", async () => {
    const { stdout } = await run("--json", "config", "list");
    const parsed = JSON.parse(stdout);
    expect(parsed["api-url"]).toBe("https://production-tbd-bets-api.tbd.vote");
    expect(parsed["bet-size"]).toBe("1.00");
  });
});

describe("config set / get", () => {
  it("sets and gets a value", async () => {
    await run("config", "set", "bet-size", "2.50");
    const { stdout } = await run("config", "get", "bet-size");
    expect(stdout.trim()).toBe("2.50");
  });

  it("rejects setting api-key", async () => {
    try {
      await run("config", "set", "api-key", "foo");
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.stderr).toContain("tbd-vote login");
    }
  });

  it("rejects unknown key", async () => {
    try {
      await run("config", "set", "unknown-key", "foo");
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.stderr).toContain("Unknown config key");
    }
  });
});

describe("config set persistence", () => {
  it("persists across invocations", async () => {
    await run("config", "set", "bet-size", "3.00");
    await run("config", "set", "default-limit", "50");

    const { stdout } = await run("--json", "config", "list");
    const parsed = JSON.parse(stdout);
    expect(parsed["bet-size"]).toBe("3.00");
    expect(parsed["default-limit"]).toBe("50");
  });
});
