/**
 * Add the missing JRT on ARM64 GNU/Linux.
 */
import { paths } from "@/main/fs/paths";
import { jrt } from "@/main/jrt/install";
import { dlx } from "@/main/net/dlx";
import { exceptions } from "@/main/util/exception";
import { unwrapESM } from "@/main/util/module";
import fs from "fs-extra";
import path from "node:path";
import * as zlib from "node:zlib";
import { pipeline } from "stream/promises";
import tar from "tar-fs";

async function installComponent(component: string) {
    const urls = await unwrapESM(import("@/refs/jrt-linux-arm.json")) as unknown as Record<string, string>;

    const root = jrt.getInstallPath(component);

    try {
        await jrt.verify(root);
        return;
    } catch {}

    if (!(component in urls)) {
        throw exceptions.create("jrt-not-available", { component });
    }

    const u = urls[component];

    if (u.startsWith("reuse:")) {
        const target = u.slice("reuse:".length);
        await installComponent(target);
        await fs.ensureSymlink(jrt.getInstallPath(target), root);
        return;
    }

    const tarFile = paths.temp.to(`jrt-${component}.tar.gz`);

    console.log(`Fetching package: ${u} -> ${tarFile}`);
    await dlx.getAll([
        {
            url: u,
            path: tarFile,
            fastLink: false
        }
    ]);


    console.log(`Unpacking ${tarFile}`);
    await fs.ensureDir(root);
    const rs = fs.createReadStream(tarFile);
    const ts = zlib.createGunzip();
    const ws = tar.extract(root);
    await pipeline(rs, ts, ws);
    await fs.remove(tarFile);

    // There is a nested folder inside the tar file and we must extract it
    const pkgName = (await fs.readdir(root)).find(f => f.includes("jdk") || f.includes("jre"));

    if (!pkgName) throw "Unable to locate unpacked JRT directory";

    const pkgPath = path.join(path.dirname(root), pkgName);
    await fs.move(path.join(root, pkgName), pkgPath);
    await fs.remove(root);
    await fs.rename(pkgPath, root);

    console.log(`Verifying installation: ${root}`);
    await jrt.verify(root);
}

export const jrtLinuxArm = { installComponent };
