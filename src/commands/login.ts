import { Command } from "commander";
import readline from "node:readline";
import { setConfig } from "../lib/config.js";
import { validateApiKey } from "../lib/api.js";
import { printSuccess, printError } from "../lib/output.js";

export function registerLogin(program: Command): void {
  program
    .command("login")
    .description("Authenticate with your TBD API key")
    .option("--key <api-key>", "API key (non-interactive mode)")
    .action(async (opts) => {
      const jsonMode = program.opts().json ?? false;

      try {
        if (opts.key) {
          await nonInteractiveLogin(opts.key, jsonMode);
        } else {
          await interactiveLogin(jsonMode);
        }
      } catch (err) {
        printError(err, jsonMode);
      }
    });
}

async function nonInteractiveLogin(
  apiKey: string,
  jsonMode: boolean,
): Promise<void> {
  if (!apiKey.startsWith("tbd_api_")) {
    printError(
      new Error('Invalid API key format. Keys start with "tbd_api_".'),
      jsonMode,
    );
    return;
  }

  const valid = await validateApiKey(apiKey);
  if (!valid) {
    printError(
      new Error(
        "Invalid API key. Generate a new key at https://tbd.vote/login",
      ),
      jsonMode,
    );
    return;
  }

  setConfig("api-key", apiKey);
  printSuccess(
    jsonMode
      ? { status: "ok", message: "API key verified and saved." }
      : "\u2713 API key verified and saved.",
    jsonMode,
  );
}

async function interactiveLogin(jsonMode: boolean): Promise<void> {
  process.stdout.write(`
  Welcome to TBD CLI

  To get started, you need an API key:

  1. Go to https://tbd.vote
  2. Log in or sign up using email, Google, Apple, or Twitter
     (external wallets like Phantom are not supported for agent features)
  3. Open Profile \u2192 Agent Access \u2192 Generate API Key
  4. Copy the key and paste it below

`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const apiKey = await new Promise<string>((resolve) => {
    rl.question("  API Key: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!apiKey) {
    printError(new Error("No API key provided."), jsonMode);
    return;
  }

  if (!apiKey.startsWith("tbd_api_")) {
    printError(
      new Error('Invalid API key format. Keys start with "tbd_api_".'),
      jsonMode,
    );
    return;
  }

  process.stdout.write("\n  Verifying...\n");

  const valid = await validateApiKey(apiKey);
  if (!valid) {
    printError(
      new Error(
        "Invalid API key. Generate a new key at https://tbd.vote/login",
      ),
      jsonMode,
    );
    return;
  }

  setConfig("api-key", apiKey);
  process.stdout.write(`
  \u2713 API key verified. You're ready to go!

  Try: tbd-vote campaigns list
\n`);
}
