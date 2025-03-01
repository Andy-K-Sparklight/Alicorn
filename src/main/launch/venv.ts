import type { Container } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { reg } from "@/main/registry/registry";
import { getOSName } from "@/main/sys/os";
import fs from "fs-extra";
import path from "node:path";

const mounted = new Set<string>();

function setVenvRoot(c: Container) {
    c.props.root = getVenvPath(c.props.id);
}

function isMounted(c: Container) {
    return mounted.has(c.props.id);
}

async function mount(c: Container) {
    if (isMounted(c)) return;

    console.log(`Mounting virtual container ${c.props.id}`);
    const vp = getVenvPath(c.props.id);
    await fs.remove(vp);
    await fs.ensureDir(path.dirname(vp));
    await fs.move(c.props.root, vp);
    setVenvRoot(c);

    mounted.add(c.props.id);
}

async function unmount(c: Container) {
    if (!isMounted(c)) return;

    console.log(`Unmounting virtual container ${c.props.id}`);
    const rp = paths.game.to(c.props.id);
    await fs.remove(rp);
    await fs.ensureDir(path.dirname(rp));
    await fs.move(c.props.root, rp);
    await fs.remove(paths.game.to(".venv", c.props.id));
    c.props.root = rp;

    mounted.delete(c.props.id);
}

function getVenvPath(cid: string) {
    const root = paths.game.to(".venv", cid);

    switch (getOSName()) {
        case "linux":
        case "windows":
            return path.join(root, ".minecraft");
        case "osx":
            return path.join(root, "Library", "Application Support", "minecraft");
    }
}

function createVenvArgs(c: Container): string[] {
    const root = paths.game.to(".venv", c.props.id);
    return [`-Duser.home=${root}`];
}

/**
 * Recover virtual environments that's in use when Alicorn was closed last time.
 */
async function recover(): Promise<void> {
    try {
        const dirs = await fs.readdir(paths.game.to(".venv"));
        for (const d of dirs) {
            if (reg.containers.has(d)) {
                const src = getVenvPath(d);
                const dst = paths.game.to(d);

                console.debug(`Recovering VENV ${src} -> ${dst}`);

                await fs.remove(dst);
                await fs.ensureDir(path.dirname(dst));
                await fs.move(src, dst);
                await fs.remove(paths.game.to(".venv", d));
            }
        }
    } catch {}
}

export const venv = { createVenvArgs, mount, unmount, setVenvRoot, isMounted, recover };
