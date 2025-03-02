import { ACCOUNT_REG_TRANS, ACCOUNT_REG_VERSION, type AccountProps } from "@/main/auth/types";
import { CONTAINER_REG_TRANS, CONTAINER_REG_VERSION, type ContainerProps } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { GAME_REG_TRANS, GAME_REG_VERSION, type GameProfile } from "@/main/game/spec";
import { isENOENT } from "@/main/util/fs";
import deepFreeze from "deep-freeze-es6";
import fs from "fs-extra";

let registryContent: Record<string, Record<string, unknown>> & { versions?: Record<string, number> } = {};

export type RegistryTransformer = (src: any) => any;

/**
 * A registry mapping unique IDs to objects.
 * Registry objects are immutable.
 */
export class NamedRegistry<T> {
    #name: string;
    #version: number;
    #transformers: RegistryTransformer[];

    constructor(name: string, version: number, transformers: RegistryTransformer[]) {
        this.#name = name;
        this.#version = version;
        this.#transformers = transformers;
    }

    upgrade() {
        let table = registryContent[this.#name];
        if (!table) {
            table = {};
            registryContent[this.#name] = table;
        }

        if (!registryContent.versions) {
            registryContent.versions = {};
        }

        const currentVersion = registryContent.versions[this.#name] ?? 0;

        for (let i = currentVersion; i < this.#version; i++) {
            console.log(`Upgrading registry ${this.#name} from version ${i}`);
            for (const [k, v] of Object.entries(table)) {
                const trans = this.#transformers[i];
                if (trans) {
                    table[k] = trans(v);
                }
            }
        }

        registryContent.versions[this.#name] = this.#version;
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

    entries(): [string, T] [] {
        return Object.entries(registryContent[this.#name] ?? {}) as [string, T] [];
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

        // Upgrade before freezing
        for (const r of Object.values(reg)) {
            r.upgrade();
        }

        // Freeze to prevent uncaught modification
        if (import.meta.env.AL_DEV) {
            for (const tb of Object.values(registryContent)) {
                for (const v of Object.values(tb)) {
                    deepFreeze(v);
                }
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

    purgeRegistries();

    await fs.outputJSON(fp, registryContent, { spaces: 4 });
}

/**
 * Remove unreachable containers and accounts.
 */
function purgeRegistries() {
    const usedContainers = new Set<string>();
    const usedAccounts = new Set<string>();

    for (const g of reg.games.getAll()) {
        usedContainers.add(g.launchHint.containerId);
        usedAccounts.add(g.launchHint.accountId);
    }

    for (const k of reg.containers.keys()) {
        if (!usedContainers.has(k)) {
            reg.containers.remove(k);
        }
    }

    for (const k of reg.accounts.keys()) {
        if (!usedAccounts.has(k)) {
            reg.accounts.remove(k);
        }
    }
}

export const registry = {
    init, close
};

export const reg = {
    accounts: new NamedRegistry<AccountProps>("accounts", ACCOUNT_REG_VERSION, ACCOUNT_REG_TRANS),
    containers: new NamedRegistry<ContainerProps>("containers", CONTAINER_REG_VERSION, CONTAINER_REG_TRANS),
    games: new NamedRegistry<GameProfile>("games", GAME_REG_VERSION, GAME_REG_TRANS)
};
