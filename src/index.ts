import { Command } from "commander";
import { registerLogin } from "./commands/login.js";
import { registerAuth } from "./commands/auth.js";
import { registerConfig } from "./commands/config.js";
import { registerCampaigns } from "./commands/campaigns.js";
import { registerBalance } from "./commands/balance.js";
import { registerBets } from "./commands/bets.js";
import { registerStrategy } from "./commands/strategy.js";

const program = new Command();

program
  .name("tbd-vote")
  .description("CLI for AI agents to browse and bet on TBD")
  .version("0.2.0")
  .option("--json", "Output as JSON");

registerLogin(program);
registerAuth(program);
registerConfig(program);
registerCampaigns(program);
registerBalance(program);
registerBets(program);
registerStrategy(program);

program.parse();
