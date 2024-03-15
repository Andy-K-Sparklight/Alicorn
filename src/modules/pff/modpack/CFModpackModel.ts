import path from "path";
import { safeGet } from "../../commons/Null";
import { ProfileType } from "../../profile/WhatProfile";
// Alicorn NEVER intends to support CF modpacks, while it's a popular function, I'll just prove it's easy...
// Alicorn has better support for Install.json and CAN run with OFFICIAL launcher!
export interface ModpackModel {
    baseVersion: string;
    modLoaders: SimpleModLoaderInfo[];
    overrideSourceDir: string;
    files: SimpleFile[];
    displayName: string;
    author: string;
    packVersion: string;
}

export interface SimpleModLoaderInfo {
    type: ProfileType;
    version: string;
}

export interface SimpleFile {
    projectID: number | string;
    fileID: number | string;
}

export function transformManifest5(
    src: Record<string, unknown>,
    contextDir: string
): ModpackModel | null {
    const bv = String(safeGet(src, ["minecraft", "version"], ""));
    if (bv.length === 0) {
        return null;
    }
    const pv = String(src.version || "");
    const auth = String(src.author || "");
    const name = String(src.name || "");
    const fs = (src.files as SimpleFile[]) || [];
    let ml = safeGet(src, ["minecraft", "modLoaders"], []) || [];
    if (!(ml instanceof Array)) {
        ml = [];
    }
    const mlx = (ml as Record<string, string>[]).map((m) => {
        return extractModLoader(String(m.id || ""));
    });
    const oml: SimpleModLoaderInfo[] = [];
    for (const m of mlx) {
        if (m !== null) {
            oml.push(m);
        }
    }

    const od = String(src.overrides || "");
    return {
        author: auth,
        displayName: name,
        overrideSourceDir: od.length === 0 ? "" : path.join(contextDir, od),
        modLoaders: oml,
        files: fs,
        baseVersion: bv,
        packVersion: pv
    };
}

function extractModLoader(o: string): SimpleModLoaderInfo | null {
    const a = o.split("-");
    const ml = (a.shift() || "").trim();
    const mv = a.join("-");
    if (ml.length === 0) {
        return null;
    }
    switch (ml.toLowerCase()) {
        case "forge":
            return {
                type: ProfileType.FORGE,
                version: mv
            };

        case "fabric":
        default:
            return {
                type: ProfileType.FABRIC,
                version: mv
            };
    }
}
