import { Command } from "commander";
import { getConfigValue } from "../lib/config.js";
import { apiGet } from "../lib/api.js";
import { printSuccess, printError, printTable } from "../lib/output.js";
import type { Campaign, CampaignListResponse } from "../types.js";

export function registerCampaigns(program: Command): void {
  const campaigns = program
    .command("campaigns")
    .description("Browse prediction campaigns");

  campaigns
    .command("list")
    .description("List campaigns")
    .option("--status <status>", "Filter by status (open|ended)")
    .option("--category <category>", "Filter by category")
    .option("--filter <filter>", "Sort/filter preset (new|ending|trending)")
    .option("--limit <limit>", "Max results")
    .option("--cursor <cursor>", "Pagination cursor")
    .action(async (opts) => {
      const jsonMode = program.opts().json ?? false;

      try {
        const params: Record<string, string | undefined> = {
          status: opts.status ?? getConfigValue("default-status") ?? undefined,
          category: opts.category,
          filter: opts.filter,
          limit: opts.limit ?? getConfigValue("default-limit") ?? undefined,
          cursor: opts.cursor,
        };

        const data = await apiGet<CampaignListResponse>(
          "/agents/campaigns",
          params,
        );

        if (jsonMode) {
          printSuccess(data, true);
        } else {
          const rows = data.campaigns.map((c) => ({
            id: c.id.length > 12 ? c.id.slice(0, 12) + "..." : c.id,
            title:
              c.title.length > 40 ? c.title.slice(0, 37) + "..." : c.title,
            status: c.status,
            ends: c.endDate ? c.endDate.split("T")[0] : "-",
          }));

          printTable(rows, [
            { key: "id", label: "ID" },
            { key: "title", label: "Title" },
            { key: "status", label: "Status" },
            { key: "ends", label: "Ends" },
          ]);

          if (data.cursor) {
            process.stdout.write(
              `\nShowing ${data.campaigns.length} of ${data.total} campaigns. Next: tbd-vote campaigns list --cursor ${data.cursor}\n`,
            );
          } else {
            process.stdout.write(
              `\n${data.campaigns.length} campaign(s).\n`,
            );
          }
        }
      } catch (err) {
        printError(err, jsonMode);
      }
    });

  campaigns
    .command("get")
    .description("Get campaign details")
    .argument("<campaign-id>", "Campaign ID")
    .action(async (campaignId: string) => {
      const jsonMode = program.opts().json ?? false;

      try {
        const campaign = await apiGet<Campaign>(
          `/agents/campaigns/${campaignId}`,
        );

        if (jsonMode) {
          printSuccess(campaign, true);
        } else {
          const endDate = campaign.endDate
            ? campaign.endDate.split("T")[0]
            : "-";
          process.stdout.write(`${campaign.title}\n`);
          process.stdout.write(
            `Status: ${campaign.status} | Ends: ${endDate} | Category: ${campaign.category}\n`,
          );

          if (campaign.description) {
            process.stdout.write(`\n${campaign.description}\n`);
          }

          process.stdout.write("\nOptions:\n");
          campaign.options.forEach((opt, i) => {
            process.stdout.write(
              `  ${i + 1}. ${opt.title}  (odds: ${opt.odds})\n`,
            );
          });

          if (campaign.userBets.length > 0) {
            process.stdout.write("\nYour bets:\n");
            campaign.userBets.forEach((bet) => {
              process.stdout.write(
                `  $${bet.amount.toFixed(2)} on "${bet.optionTitle}" (tx: ${bet.txSignature})\n`,
              );
            });
          } else {
            process.stdout.write("\nYour bets: none\n");
          }
        }
      } catch (err) {
        printError(err, jsonMode);
      }
    });
}
