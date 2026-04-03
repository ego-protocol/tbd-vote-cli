import { Command } from "commander";
import { getConfigValue } from "../lib/config.js";
import { apiGet, apiPost } from "../lib/api.js";
import { printSuccess, printError } from "../lib/output.js";
import { DEFAULT_BET_SIZE } from "../lib/constants.js";
import type { BalanceResponse, Campaign, PlaceBetApiResponse, PlaceBetResult } from "../types.js";

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
          : parseFloat(getConfigValue("bet-size") || DEFAULT_BET_SIZE);

        if (isNaN(amount) || amount <= 0) {
          printError(new Error("Invalid bet amount."), jsonMode);
          return;
        }

        // Check balance before betting
        const { balance } = await apiGet<BalanceResponse>("/agents/balance");
        if (balance < amount) {
          printError(
            new Error(
              `Insufficient balance: ${balance.toFixed(2)} USDC available, but bet requires ${amount.toFixed(2)} USDC.\nFund your wallet at https://tbd.vote`,
            ),
            jsonMode,
          );
          return;
        }

        // Fetch campaign to resolve titles and validate option
        const campaign = await apiGet<Campaign>(
          `/agents/campaigns/${campaignId}`,
        );

        const numOptionId = Number(optionId);
        const option = campaign.options.find((o) => o.id === numOptionId);
        if (!option) {
          const valid = campaign.options
            .map((o) => `${o.id} (${o.label})`)
            .join(", ");
          printError(
            new Error(
              `Invalid option "${optionId}" for campaign "${campaign.question}"\nValid options: ${valid}`,
            ),
            jsonMode,
          );
          return;
        }

        // Check max bet per campaign
        const USDC_DECIMALS = 1_000_000;
        const maxPerCampaign = parseFloat(
          getConfigValue("max-bet-per-campaign") || "20.00",
        );
        const existingSpend = (campaign.userBets || []).reduce(
          (sum, bet) => sum + bet.betAmount / USDC_DECIMALS,
          0,
        );
        if (existingSpend + amount > maxPerCampaign) {
          printError(
            new Error(
              `Would exceed max bet per campaign: ${existingSpend.toFixed(2)} already bet + ${amount.toFixed(2)} = ${(existingSpend + amount).toFixed(2)} USDC (max: ${maxPerCampaign.toFixed(2)} USDC).\nAdjust with: tbd-vote config set max-bet-per-campaign <amount>`,
            ),
            jsonMode,
          );
          return;
        }

        const data = await apiPost<PlaceBetApiResponse>(
          "/agents/txns/place-bet",
          { campaign_id: Number(campaignId), option_id: numOptionId, amount: Math.round(amount * USDC_DECIMALS) },
        );

        const result: PlaceBetResult = {
          ...data,
          campaignTitle: campaign.question,
          optionTitle: option.label,
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
