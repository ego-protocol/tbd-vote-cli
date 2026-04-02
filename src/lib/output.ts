import { ApiError } from "./api.js";

export function printJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

export function printSuccess(data: unknown, jsonMode: boolean): void {
  if (jsonMode) {
    printJson(data);
  } else if (typeof data === "string") {
    process.stdout.write(data + "\n");
  } else {
    printJson(data);
  }
}

export function printError(error: unknown, jsonMode: boolean): void {
  if (error instanceof ApiError) {
    if (jsonMode) {
      process.stderr.write(
        JSON.stringify({ error: error.code, message: error.message }) + "\n",
      );
    } else {
      process.stderr.write(`Error: ${error.message}\n`);
    }
  } else if (error instanceof Error) {
    if (jsonMode) {
      process.stderr.write(
        JSON.stringify({ error: "UNKNOWN_ERROR", message: error.message }) + "\n",
      );
    } else {
      process.stderr.write(`Error: ${error.message}\n`);
    }
  } else {
    process.stderr.write(`Error: ${String(error)}\n`);
  }
  process.exit(1);
}

export function printTable(
  rows: Record<string, string>[],
  columns: { key: string; label: string }[],
): void {
  if (rows.length === 0) {
    process.stdout.write("No results.\n");
    return;
  }

  const widths = columns.map((col) =>
    Math.max(col.label.length, ...rows.map((r) => (r[col.key] || "").length)),
  );

  const header = columns
    .map((col, i) => col.label.padEnd(widths[i]))
    .join("  ");
  const separator = widths.map((w) => "─".repeat(w)).join("  ");

  process.stdout.write(header + "\n");
  process.stdout.write(separator + "\n");

  for (const row of rows) {
    const line = columns
      .map((col, i) => (row[col.key] || "").padEnd(widths[i]))
      .join("  ");
    process.stdout.write(line + "\n");
  }
}
