import {
  ACCOUNT_EXPIRES_KEY,
  ACCOUNT_LAST_REFRESHED_KEY,
  MicrosoftAccount,
} from "../auth/MicrosoftAccount";
import { getBoolean } from "../config/ConfigSupport";

let PROM: Promise<boolean> | null = null;
export function setupMSAccountRefreshService(): void {
  if (!getBoolean("readyboom")) {
    return;
  }
  let lock = true;
  setInterval(async () => {
    if (lock) {
      return;
    }
    lock = true;
    PROM = keepMSAccountLowPriority();
    await PROM;
    PROM = null;
    lock = false;
  }, 1800000); // 30 minutes
  PROM = keepMSAccountLowPriority();
  PROM.then(() => {
    lock = false;
    PROM = null;
  }).catch(() => {});
}

export function dropAccountPromise(): void {
  PROM = null;
}

export function waitMSAccountReady(): Promise<boolean> {
  if (isMSAccountValid()) {
    return Promise.resolve(true);
  }
  if (PROM) {
    return PROM;
  }
  return Promise.resolve(false);
}

export function isMSAccountValid(): boolean {
  const refreshedAt = new Date(
    localStorage.getItem(ACCOUNT_LAST_REFRESHED_KEY) || 0
  );
  const expires =
    parseInt(localStorage.getItem(ACCOUNT_EXPIRES_KEY) || "0") * 1000; // s to ms
  const validTo = new Date(refreshedAt.getTime() + expires);
  return new Date().getTime() < validTo.getTime();
}

export async function keepMSAccountLowPriority(): Promise<boolean> {
  const refreshedAt = new Date(
    localStorage.getItem(ACCOUNT_LAST_REFRESHED_KEY) || 0
  );

  const expires =
    parseInt(localStorage.getItem(ACCOUNT_EXPIRES_KEY) || "0") * 1000; // s to ms
  const validTo = new Date(refreshedAt.getTime() + expires);
  if (new Date().getTime() < validTo.getTime()) {
    return true;
  }
  const account = new MicrosoftAccount("");
  if (account.lastUsedUUID.trim().length === 0) {
    return false; // Not using MS account
  }
  console.log("[ReadyBoom] MS account has expired! Refreshing.");
  // Just refresh time
  if (!(await account.flushToken())) {
    console.log("[ReadyBoom] Flush failed! Reauthing quietly.");
    if (!(await account.performAuth("", true))) {
      console.log("[ReadyBoom] Auth failed! Skipped this turn.");
      return false; // Failed to auth
    } else {
      console.log("[ReadyBoom] Auth successful!");
    }
  } else {
    console.log("[ReadyBoom] Token flushed successfully, finished.");
  }
  return true;
}
