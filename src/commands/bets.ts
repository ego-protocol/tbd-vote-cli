import { Command } from "commander";
import { apiGet } from "../lib/api.js";
import { printSuccess, printError, printTable } from "../lib/output.js";
import {
  BetStatus,
  BetStatusFilter,
  type BetsListResponse,
  type BetStatsResponse,
} from "../types.js";

const USDC_DECIMALS = 1_000_000;

function tokensToUsdc(tokens: number): number {
  return tokens / USDC_DECIMALS;
}

export function registerBets(program: Command): void {
  const bets = program
    .command("bets")
    .description("View bet history and stats");

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
