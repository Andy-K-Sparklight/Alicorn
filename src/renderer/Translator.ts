import { readFile } from "fs-extra";
import os from "os";
import path from "path";
import React from "react";
import { getString } from "../modules/config/ConfigSupport";
import { getPathInDefaults } from "../modules/config/DataSupport";
function currentLocale(): string {
  return getString("assistant", "PonyCN");
}

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

// Main translate function
// ATTENETION! This function actually CAN return a JSX Element
// We use string here to 'cheat' TSC
export function tr(key: string, ...values: string[]): string {
  let res = (localesMap.get(currentLocale()) || {})[key];
  if (res === undefined) {
    res = key;
  }
  let p = String(res);
  if (p.startsWith("@HTML")) {
    p = p.slice(5);
    // Cheat TSC
    return React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: applyEnvironmentVars(applyCustomVars(p, values)),
      },
    }) as unknown as string;
  }
  return applyEnvironmentVars(applyCustomVars(p, values));
}

export function randsl(key: string, ...values: string[]): string {
  const res = (localesMap.get(currentLocale()) || {})[key];
  if (typeof res === "string") {
    return res;
  }
  if (typeof res === "undefined") {
    return key;
  }
  if (res.length === 0) {
    return key;
  }
  const trimmed = trimControlCode(res, values);
  return trimmed[Math.floor(Math.random() * trimmed.length)];
}

export async function initTranslator(): Promise<void> {
  registryLocale("PonyCN", await buildLocale("PonyCN"));
}

async function buildLocale(
  name: string
): Promise<Record<string, string | string[]>> {
  try {
    const f = (await readFile(getPathInDefaults(name + ".lang"))).toString();
    const a = f.split("\n");
    const b: string[] = [];
    for (const l1 of a) {
      const s = l1.trim();
      if (s.length > 0) {
        if (s === "@empty") {
          b.push("");
        } else {
          b.push(s);
        }
      }
    }
    const out: Record<string, string | string[]> = {};
    const fullLength = b.length;
    let cursor = 0;
    let buff: string[] = [];
    let ctitle = "";
    while (cursor < fullLength) {
      const cline = b[cursor];
      if (cline.startsWith("#")) {
        // Clean prev buffer
        if (ctitle.length > 0) {
          if (buff.length === 1) {
            out[ctitle] = buff[0];
          } else if (buff.length >= 2) {
            out[ctitle] = buff;
          }
        }
        ctitle = cline.slice(1).trim();
        buff = [];
      } else {
        buff.push(eval("`" + cline.trim() + "`"));
      }
      cursor++;
    }
    if (ctitle.length > 0) {
      if (buff.length === 1) {
        out[ctitle] = buff[0];
      } else if (buff.length >= 2) {
        out[ctitle] = buff;
      }
    }
    return out;
  } catch {
    return {};
  }
}
export function getCurrentLocale(): string {
  return currentLocale();
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
