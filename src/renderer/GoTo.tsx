import { throttle } from "throttle-debounce";
import { getBoolean, saveAndReloadMain } from "../modules/config/ConfigSupport";
import { loadMirror } from "../modules/download/Mirror";
import { setContainerListDirty } from "./ContainerManager";
import { setDirty } from "./LaunchPad";

const PAGES_HISTORY: string[] = [];
const TITLE_HISTORY: string[] = [];
export const jumpTo = throttle(500, (target: string, keepHistory = true) => {
  // @ts-ignore
  if (window[CHANGE_PAGE_WARN]) {
    window.dispatchEvent(
      new CustomEvent("changePageWarn", {
        detail: { target: target, history: keepHistory },
      })
    );
    return;
  }
  // if (keepHistory) {
  PAGES_HISTORY.push(target);
  // }
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
});

function ifLeavingLaunchPadThenSetDirty(): void {
  setDirty();
}

function ifLeavingContainerManagerThenSetContainerListDirty(): void {
  setContainerListDirty();
}

function ifLeavingConfigThenReload(): void {
  if (window.location.hash.includes("Options")) {
    void saveAndReloadMain();
    void loadMirror();
  }
}

export const triggerSetPage = throttle(
  500,
  (page: string, _keepHistory = true) => {
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
    document.dispatchEvent(new CustomEvent("setPage", { detail: page }));
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
