import { submitInfo, submitWarn } from "../../renderer/Message";
import { getString, set } from "../config/ConfigSupport";
import { registerCommand } from "./CommandListener";

export function initBase(): void {
  registerCommand("echo", async (a) => {
    submitInfo(a.join(" "));
  });
  registerCommand("dargs", async (a) => {
    submitInfo(a.join("/"));
  });
  registerCommand("set", async (a) => {
    const k = a[0];
    if (!k) {
      submitWarn("Invalid config key, ignored.");
      return;
    }
    let v: string | number | boolean = a[1];
    if (v !== "" && !v) {
      submitWarn("Invalid config value, ignored.");
    }
    if (v === "true") {
      v = true;
    } else if (v === "false") {
      v = false;
    } else {
      const p = parseFloat(v);
      if (!isNaN(p) && p.toString() == v) {
        v = p;
      }
    }
    set(k, v);
  });

  registerCommand("get", async (a) => {
    if (!a[0]) {
      submitWarn("No such config key, ignored.");
    }
    submitInfo(getString(a[0]));
  });

  registerCommand("wait", async (a) => {
    const x = parseInt(a[0] || "0");
    const t = isNaN(x) ? 0 : x;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, t);
    });
  });
}
