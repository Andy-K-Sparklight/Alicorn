import got from "got";
import { applyMirror } from "./Mirror";

export async function xgot(url: string, noCache = false): Promise<unknown> {
  try {
    return (
      await got.get(applyMirror(url), {
        cache: noCache ? false : undefined,
        responseType: "json",
      })
    ).body;
  } catch {
    try {
      return (
        await got.get(url, {
          cache: noCache ? false : undefined,
          responseType: "json",
        })
      ).body;
    } catch {
      return {};
    }
  }
}
