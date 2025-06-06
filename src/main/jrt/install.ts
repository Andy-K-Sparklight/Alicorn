import { lzma } from "@/main/compress/lzma";
import { conf } from "@/main/conf/conf";
import { AbstractException } from "@/main/except/exception";
import { paths } from "@/main/fs/paths";
import { jrtLinuxArm } from "@/main/jrt/linux-arm";
import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import { netx } from "@/main/net/netx";
import { getOSName } from "@/main/sys/os";
import { progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";
import * as child_process from "node:child_process";
import os from "node:os";
import path from "node:path";
import { pEvent } from "p-event";

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

export class JrtInstallationFailedException extends AbstractException<"jrt-install-failed"> {
    #component: string;

    constructor(component: string) {
        super("jrt-install-failed", { component });
        this.#component = component;
    }

    toString(): string {
        return `Failed to install JRT component: ${this.#component}`;
    }
}

async function getProfile(componentName: string): Promise<JavaRuntimeProfile> {
    const d = await netx.json(JRT_MANIFEST);
    const osp = osPair();

    let availableProfiles = d?.[osp]?.[componentName];

    // Mojang provides ARM64 native builds only for recent versions of JRT
    // For earlier versions the x86 variant can be used. They shall run with Rosetta 2.
    if (osp === "mac-os-arm64" && (!Array.isArray(availableProfiles) || availableProfiles.length === 0)) {
        availableProfiles = d?.["mac-os"]?.[componentName];
    }

    if (!Array.isArray(availableProfiles) || availableProfiles.length === 0) {
        throw new JrtInstallationFailedException(componentName);
    }

    // Gets the latest release
    return availableProfiles.reduce((prev: JavaRuntimeProfile, it) => {
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

type FileHint =
    {
        type: "directory";
    } |
    {
        downloads: {
            lzma?: FileDownload;
            raw: FileDownload;
        }
        executable: boolean;
        type: "file";
    } |
    {
        target: string;
        type: "link";
    }

type NamedFileHint = FileHint & { name: string; }

async function installRuntime(component: string, control?: ProgressController): Promise<void> {
    const { signal, onProgress } = control ?? {};

    const root = getInstallPath(component);

    try {
        await verify(component);
        console.log(`JRT component already installed: ${component}`);
        return;
    } catch {}

    console.log(`Installing JRT runtime ${component} to ${root}`);

    // Static OS identification makes it possible to tree-shake the large installer module
    if (import.meta.env.AL_OS === "linux" && import.meta.env.AL_ARCH === "arm64") {
        console.log(`Delegated component install: ${component}`);
        await jrtLinuxArm.installComponent(component);
        return;
    }

    const profile = await getProfile(component);
    console.debug(`Picked up profile ${profile.manifest.url}`);

    const dat = await netx.json(profile.manifest.url);
    let files = Object.entries(dat.files)
        .map(([name, file]) => ({ name, ...(file as FileHint) } as NamedFileHint));

    signal?.throwIfAborted();

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
        onProgress: progress.makeNamed(onProgress, "jrt.download"),
        signal
    });

    console.debug("Unpacking files...");
    await lzma.init();

    await Promise.all(progress.countPromises(
        files.filter(f => f.type === "file" && f.downloads.lzma)
            .map(async file => {
                const src = path.join(root, file.name + ".lzma");
                const dst = path.join(root, file.name);
                console.debug(`Unpacking: ${src}`);

                await lzma.inflate(src, dst);
                await fs.remove(src);
            }),
        progress.makeNamed(onProgress, "jrt.unpack")
    ));

    control?.signal?.throwIfAborted();

    console.debug("Linking files...");
    // Linking can be done very fast so no progress will be reported
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

    control?.signal?.throwIfAborted();

    console.debug("Verifying installation...");

    control?.onProgress?.(progress.indefinite("jrt.verify"));

    await verify(component);

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

async function verify(component: string): Promise<void> {
    const root = getInstallPath(component);
    const bin = path.join(root, getExecPath());

    const proc = child_process.spawn(bin, ["-version"]);

    const code = await pEvent(proc, "exit", { timeout: 5000 });

    if (code !== 0) {
        throw new JrtInstallationFailedException(component);
    }
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

export const jrt = { installRuntime, executable, verify, getInstallPath };
