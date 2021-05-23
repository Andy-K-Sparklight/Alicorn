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
  CrashAnalyze = "CrashAnalyze",
  CoreDetail = "CoreDetail",
  ModDetail = "ModDetail",
  InstallCore = "InstallCore",
  AccountManager = "AccountManager",
  InstallConfiguration = "InstallConfiguration",
  Version = "Version",
  Terminal = "Terminal",
  JavaSelector = "JavaSelector",
}
