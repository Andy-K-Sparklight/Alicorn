import { generateAction } from "../modules/command/CommandHandler";
import { set } from "../modules/config/ConfigSupport";

const UPDATE_HELP_MSG =
  "===Alicorn Updator===\n" +
  "Usage: update <enable|disable|dev|prod|help>\n" +
  "Actions:\n" +
  "help:    show this message.\n" +
  "enable:  enable auto update.\n" +
  "disable: disable auto update.\n" +
  "dev:     use development channel to update.\n" +
  "prod:    use production channel to update.";

export async function update(
  w: string,
  log: (msg: string) => void
): Promise<void> {
  const rtt = generateAction("update", w);
  if (!rtt.valid) {
    log(UPDATE_HELP_MSG);
    return;
  }
  switch (rtt.action.toLowerCase()) {
    case "enable":
      set("updator.use-update", true);
      log("Enabled auto update.");
      return;
    case "disable":
      set("updator.use-update", false);
      log("Disabled auto update.");
      return;
    case "dev":
      set("updator.dev", true);
      log("Using development channel.");
      return;
    case "prod":
      set("updator.dev", false);
      log("Using production channel.");
      return;
    case "help":
    default:
      log(UPDATE_HELP_MSG);
      return;
  }
}
