import got from "got";
import { applyMirror } from "./Mirror";

export async function xgot(
  url: string,
  noMirror = false,
  noCache = false
): Promise<unknown> {
  if (noMirror) {
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
