import { jumpTo, triggerSetPage } from "../../renderer/GoTo";
import { submitInfo, submitWarn } from "../../renderer/Message";
import { setFlag } from "../commons/Flags";
import { getString, set } from "../config/ConfigSupport";
import { registerCommand } from "./CommandListener";

export function initBase(): void {
  registerCommand("echo", (a) => {
    submitInfo(a.join(" "));
    return Promise.resolve();
  });
  registerCommand("dargs", (a) => {
    submitInfo(a.join("/"));
    return Promise.resolve();
  });
  registerCommand("sflag", (a) => {
    setFlag(String(a[0]), a[1] !== "!");
    return Promise.resolve();
  });
  registerCommand("set", (a) => {
    const k = a[0];
    if (!k) {
      submitWarn("Invalid config key, ignored.");
      return Promise.resolve();
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
    return Promise.resolve();
  });

  registerCommand("jmp", (a) => {
    jumpTo(a[0].replaceAll("\\", "/"));
    triggerSetPage(a[1]);
    return Promise.resolve();
  });
  registerCommand("get", (a) => {
    if (!a[0]) {
      submitWarn("No such config key, ignored.");
    }
    submitInfo(getString(a[0]));
    return Promise.resolve();
  });

  registerCommand("wait", (a) => {
    const x = parseInt(a[0] || "0");
    const t = isNaN(x) ? 0 : x;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, t);
    });
  });
}
