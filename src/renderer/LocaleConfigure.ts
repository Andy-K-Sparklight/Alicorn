import { getCurrentLocale, getLocaleList, setLocale, tr } from "./Translator";
import { generateAction } from "../modules/command/CommandHandler";

export async function locale(
  w: string,
  log: (msg: string) => void
): Promise<void> {
  const action = generateAction("locale", w);
  if (!action.valid) {
    log("Current locale: " + getCurrentLocale());
    return;
  }
  const locales = getLocaleList();
  const l = action.action.trim().toLowerCase();
  if (locales.includes(l)) {
    setLocale(l);
    log("Switched locale to " + tr("Lang"));
    return;
  }
  log("Unknown locale!");
  log("All locales:");
  for (const l of locales) {
    log("- " + l);
  }
}
