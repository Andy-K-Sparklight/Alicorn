import { mirror } from "@/main/net/mirrors";
import { net } from "electron";

/**
 * Fetches the content of the given URL using any available mirror.
 */
export async function mget(url: string): Promise<Response> {
    const urls = mirror.apply(url);

    for (const u of urls) {
        try {
            const r = await net.fetch(u);
            if (r.ok) return r;
        } catch (e) {
            console.error(`Mirror unreachable: ${u}`);
            console.error(e);
        }
    }

    throw `No available mirror for ${url}`;
}