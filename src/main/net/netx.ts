/**
 * Utilities related to network access.
 */
import { conf } from "@/main/conf/conf";
import { mirror } from "@/main/net/mirrors";
import { exceptions } from "@/main/util/exception";
import { net } from "electron";

/**
 * Fetches the content of the given URL using any available mirror.
 */
async function get(url: string): Promise<Response> {
    const urls = mirror.apply(url);

    for (const u of urls) {
        try {
            const signal = AbortSignal.timeout(conf().net.requestTimeout);
            const r = await net.fetch(u, { signal });
            if (r.ok) return r;
        } catch (e) {
            console.error(`Mirror unreachable: ${u}`);
            console.error(e);
        }
    }

    throw exceptions.create("network", { url });
}

async function getJSON<T = any>(url: string): Promise<T> {
    const r = await get(url);
    if (!r.ok) throw exceptions.create("network", { url, code: r.status });

    try {
        return await r.json();
    } catch (e) {
        console.error(`Unable to fetch JSON from: ${r.url}`);
        console.error(e);
    }

    throw exceptions.create("network", { url: r.url });
}

export const netx = {
    get, getJSON
};
