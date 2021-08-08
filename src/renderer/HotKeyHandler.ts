import { ipcRenderer } from "electron";
import { getBoolean } from "../modules/config/ConfigSupport";
import { jumpTo, Pages, triggerSetPage } from "./GoTo";

export function setupHotKey(keyBound: string, callback: () => unknown): void {
  ipcRenderer.send("registerHotKey", keyBound);
  ipcRenderer.on(keyBound, () => {
    if (getBoolean("hot-key")) {
      callback();
    }
  });
}

/*
Use Alt to activate Alicorn hot keys.
- l: LaunchPad
- a: Account Management
- c: Container Management
- i: Core Installer
- p: Pff

Use Ctrl to control Alicorn with development options.
- r: Reload
 */
export function activateHotKeyFeature(): void {
  setupHotKey("Alt+l", () => {
    jumpTo("/LaunchPad");
    triggerSetPage(Pages.LaunchPad);
  });
  setupHotKey("Alt+a", () => {
    jumpTo("/YggdrasilAccountManager");
    triggerSetPage(Pages.AccountManager);
  });
  setupHotKey("Alt+c", () => {
    jumpTo("/ContainerManager");
    triggerSetPage(Pages.ContainerManager);
  });
  setupHotKey("Alt+p", () => {
    jumpTo("/PffFront");
    triggerSetPage(Pages.PffFront);
  });
  setupHotKey("Alt+i", () => {
    jumpTo("/InstallCore");
    triggerSetPage(Pages.InstallCore);
  });

  setupHotKey("Ctrl+r", () => {
    if (getBoolean("dev.quick-reload")) {
      window.location.hash = "";
      window.location.reload();
    }
  });
}
