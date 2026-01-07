import type { Account } from "@/main/auth/types";
import { VanillaAccount } from "@/main/auth/vanilla";
import { YggdrasilAccount } from "@/main/auth/yggdrasil";
import { paths } from "@/main/fs/paths";
import { netx } from "@/main/net/netx";
import { nativeImage } from "electron";
import fs from "fs-extra";
import { reg } from "@/main/registry/registry";
import { accounts } from "@/main/auth/manage";

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

async function loadSkin(url: string): Promise<string> {
    const res = await netx.json(url) as SkinQueryResponse;

    const v = res.properties.find(p => p.name === "textures")?.value;
    if (!v) return "";
    const payload = JSON.parse(Buffer.from(v, "base64").toString()) as SkinPayload;
    return payload.textures.SKIN.url;
}

async function getVanillaSkin(uuid: string): Promise<string> {
    const url = `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`;
    return await loadSkin(url);
}

async function getYggdrasilSkin(a: YggdrasilAccount): Promise<string> {
    const url = `${a.host}/sessionserver/session/minecraft/profile/${a.uuid}`;
    return await loadSkin(url);
}


async function getSkin(a: Account): Promise<string> {
    if (a instanceof VanillaAccount) {
        return getVanillaSkin(a.uuid);
    }

    if (a instanceof YggdrasilAccount) {
        return getYggdrasilSkin(a);
    }

    return "";
}

const skinCache = new Map<string, [string, string]>();

async function purgeSkin(a: Account) {
    const url = await getSkin(a);

    let buf: Buffer;

    if (url) {
        const res = await netx.request(url);
        buf = Buffer.from(await res.arrayBuffer());
    } else {
        // Loads a fallback image
        buf = await fs.readFile(paths.app.to("steve.png"));
    }

    const img = nativeImage.createFromBuffer(buf);
    const headFront = img.crop({ x: 8, y: 8, width: 8, height: 8 });
    const helmFront = img.crop({ x: 40, y: 8, width: 8, height: 8 });

    skinCache.set(a.uuid, [headFront.toDataURL(), helmFront.toDataURL()]);
}

/**
 * Fetches the skin and crops the head and helm textures. Returns an array of data URLs.
 */
async function getSkinAvatar(a: Account): Promise<[string, string]> {
    let dat = skinCache.get(a.uuid);

    if (dat) {
        return dat;
    }

    await purgeSkin(a);
    return skinCache.get(a.uuid)!;
}

async function preloadSkins() {
    await Promise.allSettled(reg.accounts.entries().map(async (a) => {
        const ac = accounts.get(a[0]);
        await purgeSkin(ac);
    }));
}

export const skin = { getSkin, getSkinAvatar, preloadSkins };
