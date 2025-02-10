import type { AccountProps } from "@/main/auth/types";
import type { ContainerProps } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import type { GameProfile } from "@/main/game/spec";
import { isENOENT } from "@/main/util/fs";
import deepFreeze from "deep-freeze-es6";
import fs from "fs-extra";

let registryContent: Record<string, Record<string, unknown>> = {};

/**
 * A registry mapping unique IDs to objects.
 * Registry objects are immutable.
 */
export class NamedRegistry<T> {
    #name: string;

    constructor(name: string) {
        this.#name = name;
    }

    get(id: string): T {
        const t = registryContent[this.#name]?.[id];
        if (t === undefined) throw `Entry not found: ${id}`;
        return t as T;
    }

    has(id: string): boolean {
        return id in (registryContent[this.#name] ?? {});
    }

    add(id: string, obj: T) {
        if (!id) {
            console.warn("An entry with empty ID has been ignored.");
            return;
        }
        let m = registryContent[this.#name];
        if (!m) {
            m = { [id]: obj };
            registryContent[this.#name] = m;
        } else {
            m[id] = obj;
        }
    }

    keys(): string[] {
        return Object.keys(registryContent[this.#name] ?? {});
    }

    getAll(): T[] {
        return Object.values(registryContent[this.#name] ?? {}) as T[];
    }

    remove(id: string) {
        const m = registryContent[this.#name];

        if (m) {
            delete m[id];
        }
    }
}

async function init() {
    const fp = paths.store.to("registries.json");
    console.log(`Opening registries: ${fp}`);
    try {
        registryContent = await fs.readJSON(fp);

        // Freeze to prevent uncaught modification
        for (const tb of Object.values(registryContent)) {
            for (const v of Object.values(tb)) {
                deepFreeze(v);
            }
        }
    } catch (e) {
        if (isENOENT(e)) {
            console.log("Registry file does not exist (this is not an error).");
        } else {
            throw e;
        }
    }
}

async function close() {
    const fp = paths.store.to("registries.json");
    console.log(`Saving registries to: ${fp}`);

    await fs.outputJSON(fp, registryContent, { spaces: 4 });
}

export const registry = {
    init, close
};

export const reg = {
    accounts: new NamedRegistry<AccountProps>("accounts"),
    containers: new NamedRegistry<ContainerProps>("containers"),
    games: new NamedRegistry<GameProfile>("games")
};
