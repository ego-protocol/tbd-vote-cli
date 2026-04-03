import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { getConfigDir } from "../lib/config.js";
import { printSuccess, printError } from "../lib/output.js";
import { STRATEGY_FILENAME } from "../lib/constants.js";

const DEFAULT_TEMPLATE = `# Betting Strategy

## Focus
<!-- Which categories or topics should the agent prioritize? -->
All categories.

## Risk Profile
<!-- How aggressive should the agent bet? -->
Conservative — default bet size, diversify across campaigns.

## Decision Criteria
<!-- What factors should the agent weigh when picking an option? -->
Favor options with clear informational edges. Avoid 50/50 coin-flip markets.

## Personality
<!-- Any tone or style for the agent's reasoning? -->
Analytical and data-driven. Explain reasoning before placing each bet.
`;

function getStrategyPath(): string {
  return path.join(getConfigDir(), STRATEGY_FILENAME);
}

function getDisplayPath(): string {
  return `~/.tbd/${STRATEGY_FILENAME}`;
}

export function registerStrategy(program: Command): void {
  const strategy = program
    .command("strategy")
    .description("View or initialize your betting strategy file")
    .action(() => {
      const jsonMode = program.opts().json ?? false;
      const filePath = getStrategyPath();
      const displayPath = getDisplayPath();

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        if (jsonMode) {
          printSuccess({ path: displayPath, exists: true, content }, true);
        } else {
          process.stdout.write(content);
        }
      } else {
        if (jsonMode) {
          printSuccess({ path: displayPath, exists: false, content: null }, true);
        } else {
          process.stdout.write(
            `No strategy file found at ${displayPath}\nCreate one with: tbd-vote strategy init\n`,
          );
        }
      }
    });

  strategy
    .command("init")
    .description("Create a starter STRATEGY.md template")
    .option("--force", "Overwrite existing file")
    .action((opts) => {
      const jsonMode = program.opts().json ?? false;
      const filePath = getStrategyPath();
      const displayPath = getDisplayPath();

      if (fs.existsSync(filePath) && !opts.force) {
        printError(
          new Error(
            `${displayPath} already exists. Use --force to overwrite.`,
          ),
          jsonMode,
        );
        return;
      }

      const configDir = getConfigDir();
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const existed = fs.existsSync(filePath);
      fs.writeFileSync(filePath, DEFAULT_TEMPLATE);

      const overwrote = existed && opts.force;
      const message = overwrote
        ? `Overwrote ${displayPath} with default template.`
        : `Created ${displayPath} — edit it to define your betting strategy.`;

      printSuccess(
        jsonMode
          ? { status: "ok", path: displayPath, message }
          : message,
        jsonMode,
      );
    });
}
