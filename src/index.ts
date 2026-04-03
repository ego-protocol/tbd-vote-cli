import { Command } from "commander";
import { registerLogin } from "./commands/login.js";
import { registerAuth } from "./commands/auth.js";
import { registerConfig } from "./commands/config.js";
import { registerCampaigns } from "./commands/campaigns.js";
import { registerBalance } from "./commands/balance.js";
import { registerBet } from "./commands/bet.js";
import { registerStrategy } from "./commands/strategy.js";

const program = new Command();

program
  .name("tbd-vote")
  .description("CLI for AI agents to browse and bet on TBD")
  .version("0.1.2")
  .option("--json", "Output as JSON");

registerLogin(program);
registerAuth(program);
registerConfig(program);
registerCampaigns(program);
registerBalance(program);
registerBet(program);
registerStrategy(program);

program.parse();
