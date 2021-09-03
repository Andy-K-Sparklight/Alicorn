import { Agent } from "https";
import { getProxyAgent, needsProxy } from "./ProxyConfigure";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getBuiltAgent(url: string): any {
  if (needsProxy(url)) {
    return getProxyAgent();
  }
  try {
    return { https: getOrCreateAgent(new URL(url).host) };
  } catch {
    return undefined;
  }
}

const AGENTS_POOL: Map<string, Agent> = new Map();

function getOrCreateAgent(host: string): Agent {
  if (AGENTS_POOL.has(host)) {
    return AGENTS_POOL.get(host) as Agent;
  } else {
    const a = new Agent({
      keepAlive: true,
    });
    AGENTS_POOL.set(host, a);
    return a;
  }
}
