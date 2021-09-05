import { toBase64 } from "js-base64";
import { getActualDataPath, saveDefaultData } from "../config/DataSupport";

/*
CLAIM FOR EXTERNAL RESOURCE

This modules (AJHelper.ts) uses Authlib Injector (authlib-injector.ald), which is yushijinhun's work.
Authlib Injector is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE 3.0 (aka. AGPL-3.0) and it's a free software (free as in freedom).
It's license is compatible with ours, since we use GPL-3.0.
For details, please see https://github.com/yushijinhun/authlib-injector/blob/develop/LICENSE

A copy of authlib-injector.ald will be saved to the root dir of alicorn data.
*/

export const AJ_FILE_BASE = "authlib-injector.ald";

export async function prepareAJ(): Promise<void> {
  await saveDefaultData(AJ_FILE_BASE);
}

export function whereAJ(): string {
  return getActualDataPath(AJ_FILE_BASE);
}

export async function prefetchData(authServer: string): Promise<string> {
  try {
    return toBase64(
      await (
        await fetch(authServer, {
          method: "GET",
        })
      ).text()
    );
  } catch {
    return "";
  }
}
