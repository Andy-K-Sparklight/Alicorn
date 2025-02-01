import type { AccountProps } from "@/main/auth/types";
import type { ContainerSpec } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import type { GameProfile } from "@/main/game/spec";
import { isENOENT } from "@/main/util/fs";
import fs from "fs-extra";

let registryContent: Record<string, Record<string, unknown>> = {};

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

    await fs.outputJSON(fp, registryContent);
}

export const registry = {
    init, close
};

export const reg = {
    accounts: new NamedRegistry<AccountProps>("accounts"),
    containers: new NamedRegistry<ContainerSpec>("containers"),
    games: new NamedRegistry<GameProfile>("games")
};
