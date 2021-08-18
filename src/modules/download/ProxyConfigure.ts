import { httpsOverHttp } from "tunnel";
import { Pair } from "../commons/Collections";
import { getString } from "../config/ConfigSupport";

const PROXY_REGEX = /^[0-9A-Za-z\-.]+?:[0-9]+$/i;

export function getProxy(): Pair<string, number> {
  const gp = getString("download.global-proxy");
  if (PROXY_REGEX.test(gp)) {
    const sp = gp.split(":");
    return new Pair(sp[0].trim(), parseInt(sp[1]));
  }
  return new Pair("", -1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getProxyAgent(): any {
  const p = getProxy();
  if (p.getFirstValue().length > 0 && p.getSecondValue() > -1) {
    return {
      https: httpsOverHttp({
        proxy: {
          host: p.getFirstValue(),
          port: p.getSecondValue(),
        },
      }),
    };
  }
  return undefined;
}
