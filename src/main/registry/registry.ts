import type { AccountProps } from "@/main/auth/types";
import type { ContainerSpec } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import type { GameProfile } from "@/main/game/spec";
import fs from "fs-extra";
import { Database, type Statement } from "node-sqlite3-wasm";
import path from "node:path";

let db: Database | null = null;

const autoSaveMap = new Map<string, Map<string, unknown>>();

export class NamedRegistry<T> {
    #map: Map<string, T>;

    constructor(base?: Map<string, T>) {
        this.#map = base ?? new Map();
    }

    get(id: string): T {
        const t = this.#map.get(id);
        if (t === undefined) throw `Entry not found: ${id}`;
        return t;
    }

    add(id: string, obj: T) {
        if (!id) {
            console.warn("An entry with empty ID has been ignored.");
            return;
        }
        this.#map.set(id, obj);
    }

    keys(): string[] {
        return [...this.#map.keys()];
    }

    getAll(): T[] {
        return [...this.#map.values()];
    }

    remove(id: string) {
        this.#map.delete(id);
    }
}

let openRegistryStmt: Statement;
let insertStmt: Statement;

async function init() {
    const dbPath = paths.store.to("registries.arc");
    console.log(`Initializing registry database at ${dbPath}`);

    await fs.remove(dbPath + ".lock");
    await fs.ensureDir(path.dirname(dbPath));

    db = new Database(dbPath);

    db.exec(`
        CREATE TABLE IF NOT EXISTS registries
        (
            id      VARCHAR(32) PRIMARY KEY NOT NULL,
            content TEXT                    NOT NULL
        );
    `);

    openRegistryStmt = db.prepare(`
        SELECT content
        FROM registries
        WHERE id = ?;
    `);

    insertStmt = db.prepare(`
        INSERT OR
        REPLACE
        INTO registries
        VALUES (?, ?);
    `);
}

let loadedRegistries = new Map<string, NamedRegistry<unknown>>();

function lazyOpenRegistry<T>(name: string): NamedRegistry<T> {
    const t = loadedRegistries.get(name);
    if (t) {
        return t as NamedRegistry<T>;
    } else {
        const r = openRegistry<T>(name);
        loadedRegistries.set(name, r);
        return r;
    }
}


function openRegistry<T>(name: string): NamedRegistry<T> {
    console.debug(`Opening registry: ${name}`);

    const r = openRegistryStmt.get(name);
    let m = new Map<string, T>();
    if (r && r.content) {
        const data = JSON.parse(r.content as string) as Record<string, T>;
        for (const [k, v] of Object.entries(data)) {
            m.set(k, v);
        }
    }

    autoSaveMap.set(name, m);

    return new NamedRegistry<T>(m);
}


function close() {
    if (!db) return;

    for (const [name, content] of autoSaveMap.entries()) {
        console.log(`Saving registry: ${name}`);
        const obj: Record<string, unknown> = {};

        for (const [k, v] of content.entries()) {
            obj[k] = v;
        }

        const t = JSON.stringify(obj, null, 4);
        insertStmt.run([name, t]);
    }

    openRegistryStmt.finalize();
    insertStmt.finalize();

    db.close();
    db = null;
}


export const registry = {
    init, close
};

export const reg = {
    get accounts() {
        return lazyOpenRegistry<AccountProps>("accounts");
    },

    get containers() {
        return lazyOpenRegistry<ContainerSpec>("containers");
    },

    get games() {
        return lazyOpenRegistry<GameProfile>("games");
    }
};
