import { Command } from "commander";
import { getConfigValue } from "../lib/config.js";
import { apiPost } from "../lib/api.js";
import { printSuccess, printError } from "../lib/output.js";
import type { PlaceBetResponse } from "../types.js";

export function registerBet(program: Command): void {
  program
    .command("bet")
    .description("Place a bet on a campaign outcome")
    .argument("<campaign-id>", "Campaign ID")
    .argument("<option-id>", "Option ID")
    .argument("[amount]", "Bet amount in USDC (defaults to configured bet-size)")
    .action(async (campaignId: string, optionId: string, amountArg?: string) => {
      const jsonMode = program.opts().json ?? false;

      try {
        const amount = amountArg
          ? parseFloat(amountArg)
          : parseFloat(getConfigValue("bet-size") || "1.00");

        if (isNaN(amount) || amount <= 0) {
          printError(new Error("Invalid bet amount."), jsonMode);
          return;
        }

        const data = await apiPost<PlaceBetResponse>(
          "/agents/place-bet",
          { campaignId, optionId, amount },
        );

        if (jsonMode) {
          printSuccess(data, true);
        } else {
          process.stdout.write(
            `Placed $${data.amount.toFixed(2)} bet on "${data.optionTitle}" in "${data.campaignTitle}"\n`,
          );
          process.stdout.write(`Tx: ${data.txSignature}\n`);
        }
      } catch (err) {
        printError(err, jsonMode);
      }
    });
}
