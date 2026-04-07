import { Command } from "commander";
import { getConfigValue } from "../lib/config.js";
import { apiGet, apiPost } from "../lib/api.js";
import { printSuccess, printError, printTable } from "../lib/output.js";
import { DEFAULT_BET_SIZE } from "../lib/constants.js";
import {
  BetStatusFilter,
  type BalanceResponse,
  type BetsListResponse,
  type BetStatsResponse,
  type Campaign,
  type PlaceBetApiResponse,
  type PlaceBetResult,
} from "../types.js";

const USDC_DECIMALS = 1_000_000;

function tokensToUsdc(tokens: number): number {
  return tokens / USDC_DECIMALS;
}

export function registerBets(program: Command): void {
  const bets = program
    .command("bets")
    .description("Place, list, and view stats for bets");

  bets
    .command("place")
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
          {
            campaign_id: Number(campaignId),
            option_id: numOptionId,
            amount: Math.round(amount * USDC_DECIMALS),
          },
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

  bets
    .command("list")
    .description("List your bets")
    .option("--status <status>", "Filter by status (active|settled)")
    .option("--limit <limit>", "Page size (1-50)")
    .option("--cursor <cursor>", "Pagination cursor")
    .action(async (opts) => {
      const jsonMode = program.opts().json ?? false;

      try {
        if (opts.status) {
          const valid = Object.values(BetStatusFilter) as string[];
          if (!valid.includes(opts.status)) {
            printError(
              new Error(
                `Invalid status "${opts.status}". Valid options: ${valid.join(", ")}`,
              ),
              jsonMode,
            );
            return;
          }
        }

        const params: Record<string, string | undefined> = {
          status: opts.status,
          limit: opts.limit,
          cursor: opts.cursor,
        };

        const data = await apiGet<BetsListResponse>("/agents/bets", params);

        if (jsonMode) {
          printSuccess(data, true);
        } else {
          const rows = data.bets.map((b) => ({
            id: b.id.slice(0, 8) + "...",
            campaign:
              b.question && b.question.length > 30
                ? b.question.slice(0, 27) + "..."
                : (b.question ?? `#${b.campaignId}`),
            option: b.label.length > 20 ? b.label.slice(0, 17) + "..." : b.label,
            amount: `$${tokensToUsdc(b.betAmount).toFixed(2)}`,
            status: b.status,
            created: b.createdAt.split("T")[0],
          }));

          printTable(rows, [
            { key: "id", label: "ID" },
            { key: "campaign", label: "Campaign" },
            { key: "option", label: "Option" },
            { key: "amount", label: "Amount" },
            { key: "status", label: "Status" },
            { key: "created", label: "Created" },
          ]);

          if (data.nextCursor) {
            process.stdout.write(
              `\nShowing ${data.bets.length} bet(s). Next: tbd-vote bets list --cursor ${data.nextCursor}\n`,
            );
          } else {
            process.stdout.write(`\n${data.bets.length} bet(s).\n`);
          }
        }
      } catch (err) {
        printError(err, jsonMode);
      }
    });

  bets
    .command("stats")
    .description("Show aggregate P&L stats")
    .action(async () => {
      const jsonMode = program.opts().json ?? false;

      try {
        const data = await apiGet<BetStatsResponse>("/agents/bets/stats");

        if (jsonMode) {
          printSuccess(data, true);
        } else {
          const totalWon = tokensToUsdc(data.totalWon);
          const totalLost = tokensToUsdc(data.totalLost);
          const totalActive = tokensToUsdc(data.totalActive);
          const netPnl = totalWon - totalLost;
          const pnlSign = netPnl >= 0 ? "+" : "-";
          const losses = data.settledBets - data.winningBets;

          process.stdout.write(`Total Bets:    ${data.totalBets}\n`);
          process.stdout.write(
            `Active:        ${data.activeBets} ($${totalActive.toFixed(2)} locked)\n`,
          );
          process.stdout.write(
            `Settled:       ${data.settledBets} (${data.winningBets} wins / ${losses} losses)\n`,
          );
          process.stdout.write(`Total Won:     $${totalWon.toFixed(2)}\n`);
          process.stdout.write(`Total Lost:    $${totalLost.toFixed(2)}\n`);
          process.stdout.write(
            `Net P&L:       ${pnlSign}$${Math.abs(netPnl).toFixed(2)}\n`,
          );
        }
      } catch (err) {
        printError(err, jsonMode);
      }
    });
}
