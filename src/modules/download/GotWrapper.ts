import { getNumber } from "../config/ConfigSupport";
import { applyMirror } from "./Mirror";
import { getTimeoutController } from "./RainbowFetch";

export async function xgot(
  url: string,
  noMirror = false,
  noCache = false,
  noTimeout = false
): Promise<unknown> {
  if (noMirror) {
    try {
      const [ac, sti] = getTimeoutController(
        getNumber("download.concurrent.timeout", 5000)
      );
      const res = await fetch(url, {
        method: "GET",
        signal: ac.signal,
        keepalive: true,
      });
      sti();
      if (!res.ok) {
        throw "Failed to fetch! Code: " + res.status;
      }
      return await res.json();
    } catch (e) {
      console.log(e);
      return {};
    }
  }
  try {
    const [ac, sti] = getTimeoutController(
      getNumber("download.concurrent.timeout", 5000)
    );
    const res = await fetch(applyMirror(url), {
      method: "GET",
      signal: ac.signal,
      keepalive: true,
    });
    sti();
    if (!res.ok) {
      throw "Failed to fetch! Code: " + res.status;
    }
    return await res.json();
  } catch (e) {
    console.log(e);
    console.log("Relative url(origin): " + url);
    console.log("Relative url(mirror): " + applyMirror(url));
    return await xgot(url, true);
  }
}

export async function pgot(url: string, timeout: number): Promise<unknown> {
  const [ac, sti] = getTimeoutController(timeout);
  const res = await fetch(url, {
    method: "GET",
    signal: ac.signal,
    keepalive: true,
  });
  sti();
  if (!res.ok) {
    throw "Failed to fetch! Code: " + res.status;
  }
  return await res.json();
}
