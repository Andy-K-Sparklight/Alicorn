import { getActualDataPath, saveDefaultData } from "../config/DataSupport";

const NIDE8_NAME = "nide8auth.ald";

export async function prepareND(): Promise<void> {
    await saveDefaultData(NIDE8_NAME);
}

export function whereND(): string {
    return getActualDataPath(NIDE8_NAME);
}
