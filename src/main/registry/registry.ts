import { paths } from "@/main/fs/paths";
import fs from "fs-extra";
import { Serializer } from "superserial";
import { Database, type Statement } from "node-sqlite3-wasm";
import type { Account } from "@/main/auth/spec";
import { LocalAccount } from "@/main/auth/local";
import { MSAccount } from "@/main/auth/ms";
import type { Container } from "@/main/container/spec";
import { StaticContainer } from "@/main/container/static";
import path from "path";


let db: Database;
let statements: Statement[] = [];

interface RegistryOpenRecord {
    types: Record<string, unknown>;
    content: Map<string, unknown>;
}

const autoSaveMap = new Map<string, RegistryOpenRecord>();

export class NamedRegistry<T> {
    private map: Map<string, T>;

    constructor(base?: Map<string, T>) {
        this.map = base ?? new Map();
    }

    get(id: string): T {
        const t = this.map.get(id);
        if (t === undefined) throw `Entry not found: ${id}`;
        return t;
    }

    add(id: string, obj: T) {
        if (!id) {
            console.warn("An entry with empty ID has been ignored.");
            return;
        }
        this.map.set(id, obj);
    }

    remove(id: string) {
        this.map.delete(id);
    }
}

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
}

let loadedRegistries = new Map<string, NamedRegistry<unknown>>();

function lazyOpenRegistry<T>(name: string, types: Record<string, unknown>): NamedRegistry<T> {
    const t = loadedRegistries.get(name);
    if (t) {
        return t as NamedRegistry<T>;
    } else {
        const r = openRegistry<T>(name, types);
        loadedRegistries.set(name, r);
        return r;
    }
}


let openRegistryStmt: Statement;

function openRegistry<T>(name: string, types: Record<string, unknown>): NamedRegistry<T> {
    if (!openRegistryStmt) {
        openRegistryStmt = db.prepare(`
            SELECT content
            FROM registries
            WHERE id = ?;
        `);
        statements.push(openRegistryStmt);
    }

    console.debug(`Opening registry: ${name}`);

    const r = openRegistryStmt.get(name);
    let m = new Map<string, T>();
    if (r && r.content) {
        const sr = new Serializer({ classes: types as any });
        m = sr.deserialize(r.content as string);
    }

    autoSaveMap.set(name, {
        types,
        content: m
    });

    return new NamedRegistry<T>(m);
}

let insertStmt: Statement;

function close() {
    if (!insertStmt) {
        insertStmt = db.prepare(`
            INSERT OR
            REPLACE
            INTO registries
            VALUES (?, ?);
        `);

        statements.push(insertStmt);
    }

    for (const [name, { types, content }] of autoSaveMap.entries()) {
        console.log(`Saving registry: ${name}`);
        const sr = new Serializer({ classes: types as any });
        const t = sr.serialize(content);

        insertStmt.run([name, t]);
    }

    for (const s of statements) {
        if (!s.isFinalized) {
            s.finalize();
        }
    }

    db?.close();
}


export const registry = {
    init, close
};

export const reg = {
    get accounts() {
        return lazyOpenRegistry<Account>("accounts", { LocalAccount, MSAccount });
    },

    get containers() {
        return lazyOpenRegistry<Container>("containers", { StaticContainer });
    }
};