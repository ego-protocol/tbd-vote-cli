import { Command } from "commander";
import { getConfigValue, removeConfigValue } from "../lib/config.js";
import { validateApiKey } from "../lib/api.js";
import { printSuccess, printError } from "../lib/output.js";

export function registerAuth(program: Command): void {
  const auth = program
    .command("auth")
    .description("Manage authentication");

  auth
    .command("status")
    .description("Check whether your API key is configured and valid")
    .action(async () => {
      const jsonMode = program.opts().json ?? false;

      const apiKey = getConfigValue("api-key");
      if (!apiKey) {
        printError(
          new Error("No API key configured. Run: tbd-vote login"),
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

      const apiUrl = getConfigValue("api-url") || "https://production-tbd-bets-api.tbd.vote";

      if (jsonMode) {
        printSuccess(
          {
            authenticated: true,
            apiUrl,
          },
          true,
        );
      } else {
        printSuccess(`Authenticated.\nAPI: ${apiUrl}`, false);
      }
    });

  auth
    .command("logout")
    .description("Remove the stored API key")
    .action(() => {
      const jsonMode = program.opts().json ?? false;

      removeConfigValue("api-key");

      printSuccess(
        jsonMode
          ? { status: "ok", message: "API key removed." }
          : "API key removed.",
        jsonMode,
      );
    });
}
