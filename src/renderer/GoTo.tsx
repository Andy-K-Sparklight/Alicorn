import { ipcRenderer } from "electron";
import { throttle } from "throttle-debounce";
import { getBoolean, saveAndReloadMain } from "../modules/config/ConfigSupport";
import { loadMirror } from "../modules/download/Mirror";
import { waitUpdateFinished } from "../modules/selfupdate/Updator";
import { intervalSaveData, remoteHideWindow } from "./App";
import { setContainerListDirty } from "./ContainerManager";
import { isInstBusy } from "./Instruction";

const PAGES_HISTORY: string[] = [];
const TITLE_HISTORY: string[] = [];
export const jumpTo = throttle(500, (target: string, keepHistory = true) => {
  if (isInstBusy()) {
    return;
  }
  // @ts-ignore
  if (window[CHANGE_PAGE_WARN]) {
    window.dispatchEvent(
      new CustomEvent("changePageWarn", {
        detail: { target: target, history: keepHistory },
      })
    );
    return;
  }
  ifLeavingConfigThenReload();
  // if (keepHistory) {
  PAGES_HISTORY.push(target);
  // }
  if (getBoolean("goto.animate")) {
    const e = document.getElementById("app_main");
    const ANIMATION_TIME = 250;
    fadeOut(e);
    setTimeout(() => {
      window.scrollTo({ top: 0 });
      ifLeavingContainerManagerThenSetContainerListDirty();
      window.location.hash = target;
      setTimeout(() => {
        fadeIn(e);
      }, ANIMATION_TIME);
    }, ANIMATION_TIME);
  } else {
    window.scrollTo({ top: 0 });
    ifLeavingContainerManagerThenSetContainerListDirty();
    window.location.hash = target;
  }
});

function ifLeavingContainerManagerThenSetContainerListDirty(): void {
  setContainerListDirty();
}

function ifLeavingConfigThenReload(): void {
  if (sessionStorage.getItem("Options.Reload") === "1") {
    sessionStorage.removeItem("Options.Reload");
    remoteHideWindow();
    waitUpdateFinished(() => {
      intervalSaveData()
        .then(() => {
          ipcRenderer.send("reload");
        })
        .catch(() => {});
    });
  } else if (window.location.hash.includes("Options")) {
    void saveAndReloadMain();
    void loadMirror();
  }
}

export const triggerSetPage = throttle(
  500,
  (page: string, _keepHistory = true) => {
    if (isInstBusy()) {
      return;
    }
    // @ts-ignore
    if (window[CHANGE_PAGE_WARN]) {
      window.dispatchEvent(
        new CustomEvent("changePageWarnTitle", { detail: page })
      );
      return;
    }
    //if (keepHistory) {
    TITLE_HISTORY.push(page);
    //}
    if (getBoolean("goto.animate")) {
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("setPage", { detail: page }));
      }, 230); // Smaller than 250 to avoid init set change page warn
    } else {
      document.dispatchEvent(new CustomEvent("setPage", { detail: page }));
    }
  }
);
export function canGoBack(): boolean {
  return PAGES_HISTORY.length > 1 && TITLE_HISTORY.length > 1;
}

export function goBack(): void {
  // @ts-ignore
  if (window[CHANGE_PAGE_WARN]) {
    return; // Simply ignore
  }
  PAGES_HISTORY.pop();
  TITLE_HISTORY.pop();
  jumpTo(PAGES_HISTORY.pop() || "/", false);
  triggerSetPage(TITLE_HISTORY.pop() || "", false);
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
