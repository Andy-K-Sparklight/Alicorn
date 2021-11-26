import { Pool } from "undici";
import { getNumber } from "../config/ConfigSupport";
const POOL_MAP: Map<string, Pool> = new Map();

export function getPool(url: string): Pool | null {
  try {
    const u = new URL(url);
    const p = POOL_MAP.get(u.host);
    if (!p || p.closed || p.destroyed) {
      const np = new Pool(u.protocol + "//" + u.host, {
        keepAliveTimeout: getNumber("download.tls.keep-alive"),
        pipelining: getNumber("download.tls.pipeline"),
      });
      POOL_MAP.set(u.host, np);
      return np;
    }
    return p;
  } catch {}
  return null;
}
