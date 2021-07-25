import os from "os";
import path from "path";
import { getString } from "../modules/config/ConfigSupport";
import ChineseSimplified from "./locales/ChineseSimplified";

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
  let res = (localesMap.get(currentLocale) || {})[key];
  if (res === undefined) {
    res = key;
  }
  return applyEnvironmentVars(applyCustomVars(String(res), values));
}

export function randsl(key: string, ...values: string[]): string {
  const res = (localesMap.get(currentLocale) || {})[key];
  if (typeof res === "string") {
    return res;
  }
  if (res.length === 0) {
    return key;
  }
  const trimmed = trimControlCode(res, values);
  return trimmed[Math.floor(Math.random() * trimmed.length)];
}

export function initTranslator(): void {
  registryLocale("zh_cn", ChineseSimplified);
}

export function getCurrentLocale(): string {
  return currentLocale;
}

// {Config:key.key} returns the config
function applyEnvironmentVars(strIn: string): string {
  let primary = strIn
    .replace(/{Date}/g, new Date().toLocaleDateString())
    .replace(/{UserName}/g, getString("user.name") || os.userInfo().username)
    .replace(/{Home}/g, os.homedir())
    .replace(/{AlicornHome}/g, path.join(os.homedir(), "alicorn"))
    .replace(/{Platform}/g, os.platform());

  const extractRegex = /(?<={Config:).*?(?=})/g;
  const allConfig = primary.match(extractRegex);
  if (allConfig) {
    allConfig.forEach((cKey) => {
      const tKey = cKey.replace(/\./g, "\\.");
      const regex = new RegExp(`\\{Config\\:${tKey}\\}`, "g");
      primary = primary.replace(regex, getString(cKey));
    });
  }
  return primary;
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

// Randsl control
// Replace first
// [JavaScript Code] means only add this to choices if JS result is true
const CONTROL_CODE_REGEX = /(?<=\[).*?(?=].*)/g;

function trimControlCode(origin: string[], rules: string[]): string[] {
  const output: string[] = [];
  origin.forEach((v) => {
    const tr = applyEnvironmentVars(applyCustomVars(v, rules));
    const controlCode = tr.match(CONTROL_CODE_REGEX);
    if (controlCode && controlCode[0]) {
      try {
        const r = eval(controlCode[0]);
        if (r) {
          const a = tr.split("]");
          a.shift();
          output.push(a.join("]"));
        }
      } catch {
        // If error then we won't add this
      }
    } else {
      output.push(tr);
    }
  });
  return output;
}
