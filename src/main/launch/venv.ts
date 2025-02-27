import type { Container } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { getOSName } from "@/main/sys/os";
import fs from "fs-extra";
import path from "node:path";

const mounted = new Set<string>();

function setVenvRoot(c: Container) {
    c.props.root = getVenvPath(c);
}

function isMounted(c: Container) {
    return mounted.has(c.props.id);
}

async function mount(c: Container) {
    if (isMounted(c)) return;

    console.log(`Mounting virtual container ${c.props.id}`);
    const vp = getVenvPath(c);
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
    c.props.root = rp;

    mounted.delete(c.props.id);
}

function getVenvPath(c: Container) {
    const root = paths.game.to(".venv", c.props.id);

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

export const venv = { createVenvArgs, mount, unmount, setVenvRoot, isMounted };
