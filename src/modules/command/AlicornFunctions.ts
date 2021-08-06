import { dispatchCommand, registerCommand } from "./CommandListener";

export function registerAlicornFunctions(): void {
  // Run commands one by one, suit for AF
  registerCommand("alx", async (a) => {
    for (const x of a) {
      await dispatchCommand(x.replaceAll("'", '"'));
    }
  });
}
