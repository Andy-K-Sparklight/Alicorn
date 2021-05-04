import {
  addJava,
  getAllJava,
  getLastUsedJavaHome,
  removeJava,
  setLastUsedJavaHome,
} from "./JInfo";

export async function jconf(
  w: string,
  log: (msg: string) => void
): Promise<void> {
  const args = w.replace(/jconf( )*/i, "").split(" ");
  let action = args.shift();
  if (action === undefined || action.trim().length === 0) {
    logHelp(log);
    return;
  }
  action = action.trim();
  const pt = args.join(" ");
  switch (action.toLowerCase()) {
    case "select":
      if (pt.trim().length === 0) {
        log("Invalid java path!");
        return;
      }
      if (pt.endsWith("java") || pt.endsWith("javaw") || pt.endsWith("exe")) {
        log("You are adding a java executable - please add a java home.");
        return;
      }
      setLastUsedJavaHome(pt);
      log("Selected java home: " + pt);
      return;
    case "list": {
      const lj = getLastUsedJavaHome().trim();
      if (lj.length > 0) {
        log("Selected java home:");
        log("* " + lj);
      }
      log("All java homes:");
      for (const a of getAllJava()) {
        log("- " + a);
      }
      return;
    }
    case "add":
      if (pt.trim().length === 0) {
        log("Invalid java path!");
        return;
      }
      if (pt.endsWith("java") || pt.endsWith("javaw") || pt.endsWith("exe")) {
        log("You are adding a java executable - please add a java home.");
        return;
      }
      addJava(pt);
      log("Added java home: " + pt);
      return;
    case "remove":
      removeJava(pt);
      log("Removed java home - if it existed.");
      return;
    case "help":
    case "h":
    default:
      logHelp(log);
  }
}

function logHelp(log: (msg: string) => void): void {
  log("===Alicorn Java Configure Tool===");
  log("Usage: jconf <help|add|select|list|remove> [args]");
  log("Actions:");
  log("help:   show this message.");
  log("add:    add a java home.");
  log("select: select a java home to launch.");
  log("list:   list all java homes.");
  log("remove: remove a java home.");
}
