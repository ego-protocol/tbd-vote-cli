import { describe, it, expect, vi, beforeEach } from "vitest";
import { printSuccess, printError, printTable } from "../../lib/output.js";
import { ApiError } from "../../lib/api.js";

let stdoutOutput: string;
let stderrOutput: string;

beforeEach(() => {
  stdoutOutput = "";
  stderrOutput = "";
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    stdoutOutput += String(chunk);
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    stderrOutput += String(chunk);
    return true;
  });
  vi.spyOn(process, "exit").mockImplementation(() => {
    throw new Error("process.exit called");
  });
});

describe("printSuccess", () => {
  it("writes JSON to stdout in json mode", () => {
    printSuccess({ key: "value" }, true);
    const parsed = JSON.parse(stdoutOutput);
    expect(parsed).toEqual({ key: "value" });
  });

  it("writes plain string to stdout in human mode", () => {
    printSuccess("hello world", false);
    expect(stdoutOutput).toBe("hello world\n");
  });

  it("writes JSON for objects in human mode", () => {
    printSuccess({ key: "value" }, false);
    const parsed = JSON.parse(stdoutOutput);
    expect(parsed).toEqual({ key: "value" });
  });
});

describe("printError", () => {
  it("writes to stderr and calls process.exit(1)", () => {
    expect(() => printError(new Error("boom"), false)).toThrow("process.exit called");
    expect(stderrOutput).toBe("Error: boom\n");
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("writes structured JSON to stderr in json mode for ApiError", () => {
    expect(() =>
      printError(new ApiError(429, "RATE_LIMITED", "Too fast"), true),
    ).toThrow("process.exit called");
    const parsed = JSON.parse(stderrOutput);
    expect(parsed).toEqual({ error: "RATE_LIMITED", message: "Too fast" });
  });

  it("writes structured JSON to stderr in json mode for generic Error", () => {
    expect(() => printError(new Error("oops"), true)).toThrow("process.exit called");
    const parsed = JSON.parse(stderrOutput);
    expect(parsed).toEqual({ error: "UNKNOWN_ERROR", message: "oops" });
  });

  it("formats ApiError in human mode", () => {
    expect(() =>
      printError(new ApiError(404, "NOT_FOUND", "Campaign not found"), false),
    ).toThrow("process.exit called");
    expect(stderrOutput).toBe("Error: Campaign not found\n");
  });
});

describe("printTable", () => {
  it("outputs aligned columns with header and separator", () => {
    const rows = [
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ];
    const columns = [
      { key: "name", label: "Name" },
      { key: "age", label: "Age" },
    ];

    printTable(rows, columns);

    const lines = stdoutOutput.split("\n").filter(Boolean);
    expect(lines).toHaveLength(4); // header + separator + 2 rows
    expect(lines[0]).toContain("Name");
    expect(lines[0]).toContain("Age");
    expect(lines[1]).toMatch(/─+/);
    expect(lines[2]).toContain("Alice");
    expect(lines[3]).toContain("Bob");
  });

  it("outputs 'No results.' for empty rows", () => {
    printTable([], [{ key: "name", label: "Name" }]);
    expect(stdoutOutput).toBe("No results.\n");
  });
});
