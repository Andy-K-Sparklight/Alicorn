import { submitWarn } from "../../renderer/Message";
import { dispatchCommand, registerCommand } from "./CommandListener";

const FUNCTIONS: Map<string, string> = new Map();

export function registerAlicornFunctions(): void {
  // Run commands one by one
  registerCommand("alx", async (a) => {
    for (const x of a) {
      await dispatchCommand(x.replaceAll("'", '"'));
    }
  });
  // Define a function
  registerCommand("def", async (a) => {
    const name = a.shift()?.trim() || "";
    const fun = a.shift()?.trim() || "";
    if (name.length === 0) {
      submitWarn("You should specify the function name!");
      return;
    }
    if (fun.length === 0) {
      submitWarn("You should specify the function body!");
      return;
    }
    FUNCTIONS.set(name, fun);
  });

  // Run a function
  registerCommand("call", async (a) => {
    const name = a.shift() || "";
    if (name.length === 0) {
      submitWarn("You should specify the function name!");
      return;
    }
    const f = FUNCTIONS.get(name) || "";
    if (f.length === 0) {
      submitWarn("No such function: " + name);
      return;
    }
    await dispatchCommand(f);
  });

  // Concurrent, like Promise.all
  registerCommand("conc", async (a) => {
    await Promise.all(
      a.map((x) => {
        return dispatchCommand(x);
      })
    );
  });
}
