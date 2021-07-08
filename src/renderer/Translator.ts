import ChineseSimplified from "./locales/ChineseSimplified";
import os from "os";
import { getString } from "../modules/config/ConfigSupport";
import path from "path";

let currentLocale = "zh_cn";
const localesMap = new Map<string, Record<string, string | string[]>>();

export function registryLocale(
  code: string,
  data: Record<string, string | string[]>
): void {
  localesMap.set(code, data);
}

export function getLocaleList(): string[] {
  return Array.from(localesMap.keys());
}

export function setLocale(code: string): void {
  currentLocale = code;
}

// Main translate function
export function tr(key: string, ...values: string[]): string {
  return applyEnvironmentVars(
    applyCustomVars(
      String((localesMap.get(currentLocale) || {})[key] || key),
      values
    )
  );
}

export function randsl(key: string, ...values: string[]): string {
  const res = (localesMap.get(currentLocale) || {})[key] || key;
  if (typeof res === "string") {
    return res;
  }
  if (res.length === 0) {
    return key;
  }
  return applyEnvironmentVars(
    applyCustomVars(res[Math.floor(Math.random() * res.length)], values)
  );
}

export function initTranslator(): void {
  registryLocale("zh_cn", ChineseSimplified);
}

export function getCurrentLocale(): string {
  return currentLocale;
}

function applyEnvironmentVars(strIn: string): string {
  return strIn
    .replace(/{Date}/g, new Date().toLocaleDateString)
    .replace(/{UserName}/g, getString("user.name") || os.userInfo().username)
    .replace(/{Home}/g, os.homedir())
    .replace(/{AlicornHome}/g, path.join(os.homedir(), "alicorn"));
}

function applyCustomVars(origin: string, rules: string[]): string {
  const rulesMap = rules.map((r) => {
    const s = r.split("=");
    return [s.shift(), s.join("=")];
  });
  let cStr = origin;
  for (const p of rulesMap) {
    if (p[0]) {
      try {
        cStr = cStr.replace(new RegExp(`{${p[0]}}`, "g"), p[1] || "");
      } catch {}
    }
  }
  return cStr;
}
