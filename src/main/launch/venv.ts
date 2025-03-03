import { containers } from "@/main/container/manage";
import type { Container } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { reg } from "@/main/registry/registry";
import { getOSName } from "@/main/sys/os";
import fs from "fs-extra";
import path from "node:path";


async function hasContent(fp: string): Promise<boolean> {
    try {
        return await fs.pathExists(fp) && (await fs.readdir(fp)).length > 0;
    } catch {
        return false;
    }
}

/**
 * Tries to mount a virtual container, fails silently if it can't be done.
 */
async function mount(c: Container) {
    console.log(`Mounting virtual container ${c.props.id}`);
    const vp = getVenvPath(c.props.id);

    if (!await hasContent(vp) && await hasContent(c.props.root)) {
        try {
            await fs.remove(vp);
            await fs.ensureDir(path.dirname(vp));
            await fs.move(c.props.root, vp);
        } catch (e) {
            console.log(`Could not mount ${c.props.id} (Maybe it's still in use?)`);
            console.log(e);
        }
    }

    c.props.root = vp;
}

/**
 * Tries to unmount a virtual container, fails silently if it can't be done.
 */
async function unmount(c: Container) {
    console.log(`Unmounting virtual container ${c.props.id}`);
    const rp = containers.get(c.props.id).props.root;

    if (!await hasContent(rp) && await hasContent(c.props.root)) {
        try {
            await fs.remove(rp);
            await fs.ensureDir(path.dirname(rp));
            await fs.move(c.props.root, rp);
            await fs.remove(paths.game.to(".venv", c.props.id));
        } catch (e) {
            console.log(`Could not unmount ${c.props.id} (Maybe it's still in use?)`);
            console.log(e);
        }
    }

    c.props.root = rp;
}

async function getCurrentRoot(c: Container): Promise<string> {
    const vp = getVenvPath(c.props.id);
    if (await hasContent(vp)) return vp;
    return c.props.root;
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

        await Promise.allSettled(dirs.map(async d => {
            if (reg.containers.has(d)) {
                const vc = containers.get(d);
                vc.props.root = getVenvPath(d);

                try {
                    console.debug(`Recovering VENV for ${d}`);
                    await unmount(vc);
                } catch (e) {
                    console.log(`Failed to unmount VENV ${d} (Maybe it's still in use?)`);
                    console.log(e);
                }
            }
        }));
    } catch {}
}

export const venv = { createVenvArgs, mount, unmount, recover, getCurrentRoot };
