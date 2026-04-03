import { Command } from "commander";
import { apiGet } from "../lib/api.js";
import { printSuccess, printError } from "../lib/output.js";
import type { BalanceResponse } from "../types.js";

export function registerBalance(program: Command): void {
  program
    .command("balance")
    .description("Check USDC balance of your wallet")
    .action(async () => {
      const jsonMode = program.opts().json ?? false;

      try {
        const data = await apiGet<BalanceResponse>("/agents/balance");

        if (jsonMode) {
          printSuccess(data, true);
        } else {
          process.stdout.write(`Balance: ${data.balance.toFixed(2)} USDC\n`);
        }
      } catch (err) {
        printError(err, jsonMode);
      }
    });
}
