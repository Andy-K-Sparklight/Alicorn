import type { Account } from "@/main/auth/types";
import { VanillaAccount } from "@/main/auth/vanilla";
import { paths } from "@/main/fs/paths";
import { netx } from "@/main/net/netx";
import { nativeImage } from "electron";
import fs from "fs-extra";

interface SkinQueryResponse {
    properties: { name: string, value: string }[];
}

interface SkinPayload {
    textures: {
        SKIN: {
            url: string;
        }
    };
}

async function getVanillaSkin(uuid: string): Promise<string> {
    const url = `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`;
    const res = await netx.getJSON(url) as SkinQueryResponse;

    const v = res.properties.find(p => p.name === "textures")?.value;
    if (!v) return "";
    const payload = JSON.parse(Buffer.from(v, "base64").toString()) as SkinPayload;
    return payload.textures.SKIN.url;
}


async function getSkin(a: Account): Promise<string> {
    if (a instanceof VanillaAccount) {
        return getVanillaSkin(a.uuid);
    } else {
        return "";
    }
}

const skinCache = new Map<string, Buffer>();

/**
 * Fetches the skin and crops the head and helm textures. Returns an array of data URLs.
 */
async function getSkinAvatar(a: Account): Promise<[string, string]> {
    let dat = skinCache.get(a.uuid);

    if (!dat) {
        const url = await getSkin(a);

        if (url) {
            const res = await netx.get(url);
            dat = Buffer.from(await res.arrayBuffer());
        } else {
            // Loads a fallback image
            dat = await fs.readFile(paths.app.to("steve.png"));
        }

        skinCache.set(a.uuid, dat);
    }

    const img = nativeImage.createFromBuffer(dat);
    const headFront = img.crop({ x: 8, y: 8, width: 8, height: 8 });
    const helmFront = img.crop({ x: 40, y: 8, width: 8, height: 8 });

    return [headFront.toDataURL(), helmFront.toDataURL()];
}

export const skin = { getSkin, getSkinAvatar };
