import got from "got";
import { getNumber } from "../config/ConfigSupport";
import { applyMirror } from "./Mirror";
import { getProxyAgent } from "./ProxyConfigure";

export async function xgot(
  url: string,
  noMirror = false,
  noCache = false,
  noTimeout = false
): Promise<unknown> {
  if (noMirror) {
    try {
      return (
        await got.get(url, {
          responseType: "json",
          timeout: getNumber("download.concurrent.timeout", 5000),
          https: {
            rejectUnauthorized: false,
          },
          agent: getProxyAgent(),
        })
      ).body;
    } catch (e) {
      console.log(e);
      return {};
    }
  }
  try {
    return (
      await got.get(applyMirror(url), {
        responseType: "json",
        timeout: noTimeout
          ? undefined
          : getNumber("download.concurrent.timeout", 5000),
        https: {
          rejectUnauthorized: false,
        },
        agent: getProxyAgent(),
      })
    ).body;
  } catch (e) {
    console.log(e);
    return await xgot(url, true);
  }
}

export async function pgot(url: string, timeout: number): Promise<unknown> {
  return (
    await got.get(url, {
      responseType: "json",
      timeout: timeout,
      https: {
        rejectUnauthorized: false,
      },
      agent: getProxyAgent(),
    })
  ).body;
}
