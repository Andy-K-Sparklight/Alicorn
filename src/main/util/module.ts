/**
 * A workaround for esbuild module transform when using ESM output.
 */
export async function unwrapESM<T>(mod: Promise<T>): Promise<T> {
    return unwrap(await mod);
}

function unwrap<T>(mod: T): T {
    if (typeof mod !== "object" || mod === null) return mod;
    const m = mod as any;
    const ent = Object.keys(m);
    if (ent.length === 1 && ent[0] === "default" && m.default.__esModule) {
        return m.default;
    }
    return mod;
}

