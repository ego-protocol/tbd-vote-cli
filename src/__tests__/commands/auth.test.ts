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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tbd-cli-auth-test-"));
  env = { ...process.env, TBD_CONFIG_DIR: tmpDir };
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function run(...args: string[]) {
  return exec("node", [CLI, ...args], { env });
}

function writeConfig(config: Record<string, unknown>) {
  fs.writeFileSync(
    path.join(tmpDir, "config.json"),
    JSON.stringify(config),
  );
}

describe("auth logout", () => {
  it("removes api-key from config", async () => {
    writeConfig({ "api-key": "tbd_api_test123" });

    const { stdout } = await run("auth", "logout");
    expect(stdout).toContain("API key removed");

    const { stdout: listOut } = await run("--json", "config", "list");
    const parsed = JSON.parse(listOut);
    expect(parsed["api-key"]).toBeNull();
  });

  it("returns JSON with --json", async () => {
    writeConfig({ "api-key": "tbd_api_test123" });

    const { stdout } = await run("--json", "auth", "logout");
    const parsed = JSON.parse(stdout);
    expect(parsed.status).toBe("ok");
    expect(parsed.message).toContain("removed");
  });
});

describe("auth status", () => {
  it("errors when no key configured", async () => {
    try {
      await run("auth", "status");
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.stderr).toContain("No API key configured");
      expect(err.stderr).toContain("tbd-vote login");
    }
  });
});
