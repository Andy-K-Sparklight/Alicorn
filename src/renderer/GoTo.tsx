import { LAUNCHER_VERSION } from "../modules/commons/Constants";
import { getBoolean, saveAndReloadMain } from "../modules/config/ConfigSupport";
import { setContainerListDirty } from "./ContainerManager";
import { setDirty } from "./LaunchPad";

export function jumpTo(target: string): void {
  // @ts-ignore
  if (window[CHANGE_PAGE_WARN]) {
    window.dispatchEvent(new CustomEvent("changePageWarn", { detail: target }));
    return;
  }
  if (window.location.hash.includes("Welcome")) {
    if (window.localStorage.getItem("CurrentVersion") !== LAUNCHER_VERSION) {
      window.localStorage.setItem("CurrentVersion", LAUNCHER_VERSION);
    }
  }
  if (getBoolean("goto.animate")) {
    const e = document.getElementById("app_main");
    const ANIMATION_TIME = 250;
    fadeOut(e);
    setTimeout(() => {
      window.scrollTo({ top: 0 });
      ifLeavingLaunchPadThenSetDirty();
      ifLeavingContainerManagerThenSetContainerListDirty();
      ifLeavingConfigThenReload();
      window.location.hash = target;
      setTimeout(() => {
        fadeIn(e);
      }, ANIMATION_TIME);
    }, ANIMATION_TIME);
  } else {
    window.scrollTo({ top: 0 });
    ifLeavingLaunchPadThenSetDirty();
    ifLeavingContainerManagerThenSetContainerListDirty();
    ifLeavingConfigThenReload();
    window.location.hash = target;
  }
}

function ifLeavingLaunchPadThenSetDirty(): void {
  setDirty();
}

function ifLeavingContainerManagerThenSetContainerListDirty(): void {
  setContainerListDirty();
}

function ifLeavingConfigThenReload(): void {
  if (window.location.hash.includes("Options")) {
    saveAndReloadMain()
      .then(() => {})
      .catch(() => {});
  }
}

export function triggerSetPage(page: string): void {
  // @ts-ignore
  if (window[CHANGE_PAGE_WARN]) {
    return;
  }
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
  Tutor = "Tutor",
  ServerList = "ServerList",
}

export const CHANGE_PAGE_WARN = "ChangePageWarn";

export function setChangePageWarn(doWarn: boolean): void {
  // @ts-ignore
  window[CHANGE_PAGE_WARN] = doWarn;
}

function fadeOut(ele: HTMLElement | null) {
  if (ele) {
    ele.classList.remove("app_fade_in");
    ele.classList.add("app_fade_out");
  }
}
function fadeIn(ele: HTMLElement | null) {
  if (ele) {
    ele.classList.remove("app_fade_out");
    ele.classList.add("app_fade_in");
  }
}
