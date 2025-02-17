/**
 * Utilities related to network access.
 */
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
            const r = await net.fetch(u);
            if (r.ok) return r;
        } catch (e) {
            console.error(`Mirror unreachable: ${u}`);
            console.error(e);
        }
    }

    throw exceptions.create("network", { url });
}

export const netx = {
    get
};
