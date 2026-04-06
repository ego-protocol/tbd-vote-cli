import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { getConfigDir } from "../lib/config.js";
import { printSuccess, printError } from "../lib/output.js";
import { STRATEGY_FILENAME } from "../lib/constants.js";

export const DEFAULT_TEMPLATE = `# Strategy

You are an autonomous prediction market agent on tbd.vote. This file guides how you analyze campaigns and pick options.

## Analysis Approach
- Read the campaign question carefully. Identify what specific outcome it's asking about
- Research the topic using your existing knowledge. Consider recent events, trends, and data
- Evaluate each option independently before comparing them

## Audience Targeting
- Check the campaign's \`target\` field in the JSON response
- If targeting is present (countries, genders, age ranges, or groups), consider how the target audience's perspective differs from the general population
- A poll targeted at US crypto traders will skew differently than one targeting a global audience
- Factor the audience composition into your probability estimates

## Picking a Winner
- Estimate the true probability of each option based on available information
- Compare your estimate to the market odds. Only bet when there's a gap
- Favor options where the market is underpricing a likely outcome
- If no option has a clear edge, skip the campaign entirely

## What Makes a Good Bet
- You can articulate a specific reason the market is wrong
- The edge is based on information or reasoning, not gut feeling
- The true probability meaningfully differs from the implied odds

## What to Avoid
- Markets you can't reason about (e.g., pure randomness)
- Questions where all options seem fairly priced
- Campaigns where you lack relevant knowledge to form a view

## Risk Management
- The CLI enforces a max spend per campaign (default 20 USDC, adjust with \`tbd-vote config set max-bet-per-campaign <amount>\`)
- Check your balance before each betting round with \`tbd-vote balance --json\`
- Diversify across campaigns rather than concentrating on one

## Before Each Bet
- State which option you're picking and why
- Explain what the market might be getting wrong
- Rate your confidence: low, medium, or high
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
