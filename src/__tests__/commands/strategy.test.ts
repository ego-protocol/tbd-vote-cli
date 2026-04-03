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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tbd-cli-strategy-test-"));
  env = { ...process.env, TBD_CONFIG_DIR: tmpDir };
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function run(...args: string[]) {
  return exec("node", [CLI, ...args], { env });
}

describe("strategy (view)", () => {
  it("shows 'no file found' when STRATEGY.md missing", async () => {
    const { stdout } = await run("strategy");
    expect(stdout).toContain("No strategy file found");
    expect(stdout).toContain("tbd-vote strategy init");
  });

  it("prints file contents when STRATEGY.md exists", async () => {
    fs.writeFileSync(path.join(tmpDir, "STRATEGY.md"), "# My Strategy\nBe bold.");
    const { stdout } = await run("strategy");
    expect(stdout).toContain("# My Strategy");
    expect(stdout).toContain("Be bold.");
  });

  it("returns JSON with exists=false when no file", async () => {
    const { stdout } = await run("--json", "strategy");
    const parsed = JSON.parse(stdout);
    expect(parsed.exists).toBe(false);
    expect(parsed.content).toBeNull();
  });

  it("returns JSON with content when file exists", async () => {
    fs.writeFileSync(path.join(tmpDir, "STRATEGY.md"), "# Test");
    const { stdout } = await run("--json", "strategy");
    const parsed = JSON.parse(stdout);
    expect(parsed.exists).toBe(true);
    expect(parsed.content).toBe("# Test");
  });
});

describe("strategy init", () => {
  it("creates STRATEGY.md with template", async () => {
    const { stdout } = await run("strategy", "init");
    expect(stdout).toContain("Created");

    const content = fs.readFileSync(path.join(tmpDir, "STRATEGY.md"), "utf-8");
    expect(content).toContain("# Strategy");
    expect(content).toContain("## Analysis Approach");
    expect(content).toContain("## Picking a Winner");
  });

  it("refuses to overwrite without --force", async () => {
    fs.writeFileSync(path.join(tmpDir, "STRATEGY.md"), "custom");
    try {
      await run("strategy", "init");
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.stderr).toContain("already exists");
      expect(err.stderr).toContain("--force");
    }
    // verify original content preserved
    const content = fs.readFileSync(path.join(tmpDir, "STRATEGY.md"), "utf-8");
    expect(content).toBe("custom");
  });

  it("overwrites with --force", async () => {
    fs.writeFileSync(path.join(tmpDir, "STRATEGY.md"), "old content");
    const { stdout } = await run("strategy", "init", "--force");
    expect(stdout).toContain("Overwrote");

    const content = fs.readFileSync(path.join(tmpDir, "STRATEGY.md"), "utf-8");
    expect(content).toContain("# Strategy");
  });

  it("returns JSON response", async () => {
    const { stdout } = await run("--json", "strategy", "init");
    const parsed = JSON.parse(stdout);
    expect(parsed.status).toBe("ok");
    expect(parsed.path).toContain("STRATEGY.md");
  });
});
