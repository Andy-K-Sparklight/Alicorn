import { ALXClient } from "@/main/alx/ALXClient";
import { containers } from "@/main/container/manage";
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
    await removeMarker(c);
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
 * Places a marker in the VENV storing the ALX server port of the process which owns it.
 * By querying the marker we can determine whether the VENV is still in use when recovering.
 */
async function placeMarker(c: Container, port: number, nonce: string) {
    const f = path.join(c.gameDir(), "venv.lock");
    await fs.outputFile(f, `${nonce}@${port}`);
}

async function removeMarker(c: Container) {
    await fs.remove(path.join(c.gameDir(), "venv.lock"));
}

async function queryMarker(c: Container): Promise<boolean> {
    try {
        const f = path.join(c.gameDir(), "venv.lock");
        const [nonce, port] = (await fs.readFile(f)).toString().split("@");
        if (!nonce || !port) return false;
        const alx = new ALXClient(`ws://localhost:${port}`, nonce);
        const alive = await alx.isAlive();
        alx.close();

        return alive;

    } catch {
        return false;
    }
}

/**
 * Recover virtual environments that's in use when Alicorn was closed last time.
 */
async function recover(): Promise<void> {
    try {
        const dirs = await fs.readdir(paths.game.to(".venv"));
        for (const d of dirs) {
            if (reg.containers.has(d)) {
                const vc = containers.get(d);
                vc.props.root = getVenvPath(d);

                if (!(await queryMarker(vc))) {
                    try {
                        console.debug(`Recovering VENV for ${d}`);
                        mounted.add(d);
                        await unmount(vc);
                    } catch (e) {
                        console.error(`Failed to unmount VENV ${d}`);
                        console.error(e);
                    }
                } else {
                    console.debug(`VENV for ${d} is still in use, skipped.`);
                }
            }
        }
    } catch {}
}

export const venv = { createVenvArgs, mount, unmount, setVenvRoot, isMounted, recover, placeMarker };
