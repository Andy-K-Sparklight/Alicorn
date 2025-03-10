/**
 * Utilities related to network access.
 */
import { conf } from "@/main/conf/conf";
import { mirror } from "@/main/net/mirrors";
import { exceptions } from "@/main/util/exception";
import { net, Session } from "electron";

/**
 * Fetches the content of the given URL using any available mirror.
 */
async function get(url: string, body?: any, session?: Session): Promise<Response> {
    if (url.length === 0) throw exceptions.create("network", { url: "unknown" });

    const urls = mirror.apply(url);
    const jsonHeader = body === undefined ? undefined : { "Content-Type": "application/json" };

    for (const u of urls) {
        try {
            const signal = AbortSignal.timeout(conf().net.requestTimeout);
            const r = await (session ?? net).fetch(u, {
                headers: { ...jsonHeader },
                method: body === undefined ? "GET" : "POST",
                body: body === undefined ? undefined : JSON.stringify(body),
                signal
            });
            if (r.ok) return r;
        } catch (e) {
            console.error(`Mirror unreachable: ${u}`);
            console.error(e);
        }
    }

    throw exceptions.create("network", { url });
}

async function getJSON<T = any>(url: string, body?: any, session?: Session): Promise<T> {
    const r = await get(url, body, session);

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
