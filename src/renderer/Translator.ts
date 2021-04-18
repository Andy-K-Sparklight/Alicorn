import ChineseSimplified from "./locales/ChineseSimplified";

let currentLocale = "zh_cn";
const localesMap = new Map<string, Record<string, string | string[]>>();

export function registryLocale(
  code: string,
  data: Record<string, string | string[]>
): void {
  localesMap.set(code, data);
}

export function setLocale(code: string): void {
  currentLocale = code;
}

// Main translate function
export function tr(key: string): string {
  return String((localesMap.get(currentLocale) || {})[key] || key);
}

export function randsl(key: string): string {
  const res = (localesMap.get(currentLocale) || {})[key] || key;
  if (typeof res === "string") {
    return res;
  }
  if (res.length === 0) {
    return key;
  }
  return res[Math.floor(Math.random() * res.length)];
}

export function initTranslator(): void {
  registryLocale("zh_cn", ChineseSimplified);
}
