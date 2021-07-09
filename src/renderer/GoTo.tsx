import { setDirty } from "./LaunchPad";
import { setContainerListDirty } from "./ContainerManager";
import { saveAndReloadMain } from "../modules/config/ConfigSupport";

export function jumpTo(target: string): void {
  ifLeavingLaunchPadThenSetDirty();
  ifLeavingContainerManagerThenSetContainerListDirty();
  ifLeavingConfigThenReload();
  window.location.hash = target;
}

function ifLeavingLaunchPadThenSetDirty(): void {
  if (window.location.hash.includes("LaunchPad")) {
    setDirty();
  }
}

function ifLeavingContainerManagerThenSetContainerListDirty(): void {
  if (window.location.hash.includes("ContainerManager")) {
    setContainerListDirty();
  }
}

function ifLeavingConfigThenReload(): void {
  if (window.location.hash.includes("Options")) {
    saveAndReloadMain()
      .then(() => {})
      .catch(() => {});
  }
}

export function triggerSetPage(page: string): void {
  document.dispatchEvent(new CustomEvent("setPage", { detail: page }));
}

export enum Pages {
  CrashReportDisplay = "CrashReportDisplay",
  Options = "Options",
  ContainerManager = "ContainerManager",
  LaunchPad = "LaunchPad",
  ReadyToLaunch = "ReadyToLaunch",
  InstallCore = "InstallCore",
  AccountManager = "AccountManager",
  Version = "Version",
  JavaSelector = "JavaSelector",
  PffFront = "PffFront",
  Welcome = "Welcome",
}
