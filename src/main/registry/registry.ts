import { paths } from "@/main/fs/paths";
import fs from "fs-extra";
import { Serializer } from "superserial";

const autoSaveMap = new Map<string, unknown>();
const typesMap = new Map<string, Record<string, unknown>>();

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


function pathOf(name: string) {
    return paths.store.to(`${name}.arc`);
}

/**
 * Loads the content of the given registry and converts it to a named registry map.
 */
async function loadNamed<T>(name: string, types: Record<string, unknown>): Promise<NamedRegistry<T>> {
    const m = await load(name, new Map(), types);
    return new NamedRegistry(m);
}

/**
 * Loads the content of the given registry.
 */
async function load<T>(name: string, def: T, types: Record<string, unknown>): Promise<T> {
    const t = autoSaveMap.get(name);
    if (t) return t as T;

    console.log(`Loading registry: ${name}`);
    let dat: T | null = null;
    try {
        const content = (await fs.readFile(pathOf(name))).toString();
        const sr = new Serializer({ classes: types as any });
        dat = sr.deserialize(content);

        console.log(`Loaded registry: ${name}`);

    } catch (e) {
        if (typeof e === "object" && e !== null && "code" in e && e.code === "ENOENT") {
            console.log(`Registry ${name} does not exist (this is not an error).`);
        } else {
            throw e;
        }
    }

    if (!dat) dat = def;

    autoSaveMap.set(name, dat);
    typesMap.set(name, types);

    return dat;
}

/**
 * Save all registries that have been loaded.
 */
async function saveAll() {
    console.log("Saving registries...");
    await Promise.all(autoSaveMap.entries().map(async ([k, v]) => {
        try {
            const types = typesMap.get(k)!;
            const sr = new Serializer({ classes: types as any });
            await fs.outputFile(pathOf(k), sr.serialize(v));
        } catch (e) {
            console.error(`Unable to save registry ${k}: ${e}`);
        }
    }));
}

export const registry = {
    load, loadNamed, saveAll
};