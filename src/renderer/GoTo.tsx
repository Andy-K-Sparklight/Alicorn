import { setDirty } from "./LaunchPad";
import { setContainerListDirty } from "./ContainerManager";

export function jumpTo(target: string): void {
  setDirty();
  setContainerListDirty();
  window.location.hash = target;
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
}
