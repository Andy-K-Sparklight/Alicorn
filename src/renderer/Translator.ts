import ChineseSimplified from "./locales/ChineseSimplified";

let currentLocale = "zh_cn";
const localesMap = new Map<string, Record<string, string>>();

export function registryLocale(
  code: string,
  data: Record<string, string>
): void {
  localesMap.set(code, data);
}

export function setLocale(code: string): void {
  currentLocale = code;
}

// Main translate function
export function tr(key: string): string {
  return (localesMap.get(currentLocale) || {})[key] || key;
}

export function initTranslator(): void {
  registryLocale("zh_cn", ChineseSimplified);
}
