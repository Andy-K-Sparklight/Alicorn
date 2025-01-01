import { getOSName } from "@/main/sys/os";
import os from "node:os";
import { is } from "typia";
import { net } from "electron";
import path from "path";
import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import { netx } from "@/main/net/netx";
import fs from "fs-extra";
import { lzma } from "@/main/compress/lzma";
import * as child_process from "node:child_process";
import { paths } from "@/main/fs/paths";
import { conf } from "@/main/conf/conf";

const JRT_MANIFEST = "https://piston-meta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";

interface JavaRuntimeProfile {
    manifest: {
        sha1: string;
        size: number;
        url: string;
    };

    version?: {
        released?: string;
    };
}

function osPair(): string {
    const arch = os.arch();
    switch (getOSName()) {
        case "windows":
            if (arch.includes("arm")) return "windows-arm64";
            if (arch === "ia32") return "windows-x86";
            if (arch === "x64") return "windows-x64";
            break;
        case "osx":
            if (arch.includes("arm")) return "mac-os-arm64";
            if (arch === "x64") return "mac-os";
            break;
        case "linux":
            if (arch === "ia32") return "linux-i386";
            if (arch === "x64") return "linux";
            break;
    }

    return "unknown";
}

async function getProfile(componentName: string): Promise<JavaRuntimeProfile> {
    const d = await (await netx.get(JRT_MANIFEST)).json();
    const availableProfiles = d[osPair()][componentName];

    if (!is<JavaRuntimeProfile[]>(availableProfiles) || availableProfiles.length < 1) {
        throw `Could not find available JRT profiles for ${componentName}`;
    }

    // Gets the latest release
    return availableProfiles.reduce((prev, it) => {
        if (prev.version?.released && it.version?.released) {
            const d1 = new Date(prev.version.released);
            const d2 = new Date(it.version.released);

            return d2.getTime() > d1.getTime() ? it : prev;
        } else {
            if (it.version?.released) return it;
            return prev;
        }
    });
}

interface FileDownload {
    sha1: string;
    size: number;
    url: string;
}

type FileHint = {
    type: "directory";
} | {
    downloads: {
        lzma?: FileDownload;
        raw: FileDownload;
    }
    executable: boolean;
    type: "file";
} | {
    target: string;
    type: "link";
}

type NamedFileHint = FileHint & { name: string; }

async function installRuntime(component: string): Promise<void> {
    const root = getInstallPath(component);

    console.log(`Installing JRT runtime ${component} to ${root}`);
    const profile = await getProfile(component);
    console.debug(`Picked up profile ${profile.manifest.url}`);

    const dat = await (await net.fetch(profile.manifest.url)).json();
    let files = Object.entries(dat.files)
        .filter(([, file]) => is<FileHint>(file))
        .map(([name, file]) => ({ name, ...(file as FileHint) } satisfies NamedFileHint));

    if (conf().jrt.filterDocs) {
        const prefix = getOSName() === "osx" ? "jre.bundle/Contents/Home/legal/" : "legal/";
        files = files.filter(f => !f.name.startsWith(prefix));
    }

    const tasks: DlxDownloadRequest[] = [];
    for (const f of files.filter(f => f.type === "file")) {
        const artifact = f.downloads.lzma ?? f.downloads.raw;
        const ext = f.downloads.lzma ? ".lzma" : "";
        const dl: DlxDownloadRequest = {
            path: path.join(root, f.name + ext),
            ...artifact
        };
        tasks.push(dl);

        // We're ignoring directories here as they'll be auto-created when downloading
    }

    console.debug("Fetching files...");
    await dlx.getAll(tasks, {
        onProgress(p) {
            console.log(`${p.value.current} / ${p.value.total} completed.`);
        }
    }); // TODO add progress tracking

    console.debug("Unpacking files...");

    await lzma.init();
    await Promise.all(files.map(async file => {
        if (file.type === "file" && file.downloads.lzma) {
            const src = path.join(root, file.name + ".lzma");
            const dst = path.join(root, file.name);
            console.debug(`Unpacking: ${src}`);

            await lzma.inflate(src, dst);
            await fs.remove(src);
        }
    }));

    console.debug("Linking files...");
    await Promise.all(
        files.filter(f => f.type === "link")
            .map(async f => {
                const target = path.join(root, f.target);
                const base = path.join(root, f.name);
                console.debug(`Linking: ${target} -> ${base}`);

                await fs.link(base, target);
            })
    );

    if (getOSName() !== "windows") {
        console.debug("Making files executable...");

        await Promise.all(
            files.filter(f => f.type === "file" && f.executable)
                .map(async f => {
                    const pt = path.join(root, f.name);
                    console.debug(`Add executable flag: ${pt}`);
                    await fs.chmod(pt, 0o777);
                })
        );
    }

    console.debug("Verifying installation...");
    await verify(root);

    console.debug(`Runtime installed: ${component}`);
}

function getExecPath(): string {
    switch (getOSName()) {
        case "windows" :
            return "bin/java.exe";
        case "osx":
            return "jre.bundle/Contents/Home/bin/java";
        case "linux":
            return "bin/java";
    }
}

async function verify(root: string): Promise<void> {
    const bin = path.join(root, getExecPath());

    const proc = child_process.spawn(bin, ["-version"]);

    return new Promise<void>((res, rej) => {
        proc.once("error", rej);
        proc.once("exit", code => {
            if (code === 0) res();
            else rej(`Unexpected exit code ${code}: ${bin}`);
        });
    });
}

/**
 * Gets the path to the given JRT component home.
 */
function getInstallPath(component: string): string {
    return paths.store.to("runtimes", component);
}

/**
 * Gets the path to the JRT executable file.
 */
function executable(component: string): string {
    return path.join(getInstallPath(component), getExecPath());
}

export const jrt = { installRuntime, executable };