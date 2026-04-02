import { Command } from "commander";
import { getConfigValue } from "../lib/config.js";
import { apiGet, apiPost } from "../lib/api.js";
import { printSuccess, printError } from "../lib/output.js";
import type { Campaign, PlaceBetApiResponse, PlaceBetResult } from "../types.js";

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

        // Fetch campaign to resolve titles and validate option
        const campaign = await apiGet<Campaign>(
          `/agents/campaigns/${campaignId}`,
        );

        const option = campaign.options.find((o) => o.id === optionId);
        if (!option) {
          const valid = campaign.options
            .map((o) => `${o.id} (${o.title})`)
            .join(", ");
          printError(
            new Error(
              `Invalid option "${optionId}" for campaign "${campaign.title}"\nValid options: ${valid}`,
            ),
            jsonMode,
          );
          return;
        }

        const data = await apiPost<PlaceBetApiResponse>(
          "/agents/place-bet",
          { campaignId, optionId, amount },
        );

        const result: PlaceBetResult = {
          ...data,
          campaignTitle: campaign.title,
          optionTitle: option.title,
        };

        if (jsonMode) {
          printSuccess(result, true);
        } else {
          process.stdout.write(
            `Placed $${result.amount.toFixed(2)} bet on "${result.optionTitle}" in "${result.campaignTitle}"\n`,
          );
          process.stdout.write(`Tx: ${result.txSignature}\n`);
        }
      } catch (err) {
        printError(err, jsonMode);
      }
    });
}
