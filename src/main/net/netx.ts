/**
 * Utilities related to network access.
 */
import { conf } from "@/main/conf/conf";
import { AbstractException } from "@/main/except/exception";
import { NetRequestFailedException } from "@/main/except/net";
import { mirror } from "@/main/net/mirrors";
import { net, Session } from "electron";

/**
 * Fetches the content of the given URL using any available mirror.
 */
async function request(url: string, body?: any, session?: Session): Promise<Response> {
    let lastError;

    const urls = mirror.apply(url);
    const jsonHeader = body === undefined ? undefined : { "Content-Type": "application/json" };

    for (const u of urls) {
        let code: number | undefined = undefined;
        try {
            const signal = AbortSignal.timeout(conf().net.requestTimeout);
            const r = await (session ?? net).fetch(u, {
                headers: { ...jsonHeader },
                method: body === undefined ? "GET" : "POST",
                body: body === undefined ? undefined : JSON.stringify(body),
                signal
            });
            if (r.ok) return r;
            code = r.status;
        } catch (e) {
            console.error(`[NETX] Unable to fetch from: ${u}`);
            console.error(e);
        }
        lastError = new NetRequestFailedException(u, code);
    }

    throw new NetMirrorsAllFailedException(url, lastError);
}

async function json<T = any>(url: string, body?: any, session?: Session): Promise<T> {
    const r = await request(url, body, session);

    try {
        return await r.json();
    } catch (e) {
        console.error(`[NETX] Unable to fetch JSON from: ${r.url}`);
        console.error(e);
    }

    throw new NetMirrorsAllFailedException(url);
}


class NetMirrorsAllFailedException extends AbstractException<"net-mirrors-all-failed"> {
    #url: string;

    constructor(url: string, cause?: unknown) {
        super("net-mirrors-all-failed", { url }, cause);
        this.#url = url;
    }

    toString(): string {
        return `All mirrors have failed: ${this.#url}`;
    }
}

export const netx = {
    request, json
};
