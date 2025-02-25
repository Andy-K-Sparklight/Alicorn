/**
 * Handles post-install tasks for Forge / NeoForged installers of recent versions (V1).
 */
import type { Container } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { jrt } from "@/main/jrt/install";
import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import { MavenName } from "@/main/profile/maven-name";
import type { Library, VersionProfile } from "@/main/profile/version-profile";
import { exceptions } from "@/main/util/exception";
import { type Progress, progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";
import { nanoid } from "nanoid";
import StreamZip from "node-stream-zip";
import child_process from "node:child_process";
import path from "node:path";
import { pEvent } from "p-event";

interface InstallProfile {
    spec: 1;
    json: string;
    minecraft: string;
    data: Record<string, { client?: string }>;
    processors: Processor[];
    libraries: Library[];
}

interface Processor {
    sides?: string[];
    jar: string;
    classpath: string[];
    args: string[];
}

export interface SmeltInstallInit {
    installProfile: InstallProfile;
    versionProfile: { id: string, libraries: Library[], _comment_?: string };
}

const PROTESTING_FORGE = [
    "LexManos, the one behind Forge LLC, has been poisoning the community for a long time.",
    "Insulting other developers, banning members seeking progress, and profiting from all the mess he causes.",
    "Other developers of Forge have abandoned Lex and started a new project called NeoForged.",
    "Stop Lex from harming our community. Say NO to his donation requests. Say NO to Forge LLC.",
    "Save your money, time and kindness for the one who deserves it.",
    "Read the full story at https://neoforged.net/news/theproject"
];

/**
 * Extracts the `install-profile.json` file from the installer.
 */
async function readInstallProfile(installer: string): Promise<SmeltInstallInit> {
    let zip: StreamZip.StreamZipAsync | null = null;

    try {
        zip = new StreamZip.async({ file: installer });
        const data = await zip.entryData("install_profile.json");
        const obj = JSON.parse(data.toString());

        // TODO add support for V0 installers
        if (typeof obj === "object" && obj && "spec" in obj && obj.spec === 1) {
            const ip = obj as InstallProfile;
            const versionData = await zip.entryData(ip.json.startsWith("/") ? ip.json.slice(1) : ip.json);
            const vp = JSON.parse(versionData.toString());
            if (
                typeof vp === "object" && vp &&
                "id" in vp && typeof vp.id === "string" &&
                "libraries" in vp && Array.isArray(vp.libraries)
            ) {
                if ("_comment_" in vp) {
                    vp._comment_ = PROTESTING_FORGE;
                }
                return {
                    installProfile: ip,
                    versionProfile: vp
                };
            }
        }
    } finally {
        await zip?.close();
    }

    throw `Unable to read install profile from ${installer}`;
}

async function deployVersionProfile(init: SmeltInstallInit, container: Container): Promise<string> {
    const id = init.versionProfile.id;
    await fs.outputJSON(container.profile(id), init.versionProfile, { spaces: 2 });
    return id;
}

/**
 * Calculates values for the templates in the profile. Returns the value map and an array containing files to extract.
 */
function buildTemplateValues(
    init: SmeltInstallInit,
    installer: string,
    installerUnpack: string,
    container: Container
): [Map<string, string>, string[]] {
    const m = new Map<string, string>();
    const unpackFiles: string[] = [];

    function parseVal(src: string) {
        if (src.startsWith("[") && src.endsWith("]")) { // [<library name>]
            return container.library(src.slice(1, -1));
        } else if (src.startsWith("'") && src.endsWith("'")) { // 'escaped value'
            return src.slice(1, -1);
        } else { // File in the archive
            unpackFiles.push(src);
            return path.join(installerUnpack, src);
        }
    }

    m.set("SIDE", "client");
    m.set("MINECRAFT_JAR", container.client(init.installProfile.minecraft));
    m.set("MINECRAFT_VERSION", init.installProfile.minecraft);
    m.set("ROOT", container.gameDir());
    m.set("INSTALLER", installer);
    m.set("LIBRARY_DIR", container.librariesRoot());

    for (const [k, v] of Object.entries(init.installProfile.data)) {
        if (v.client) {
            m.set(k, parseVal(v.client));
        }
    }

    return [m, unpackFiles];
}

/**
 * Extracts files needed for installation from the installer.
 */
async function unpackInstaller(installer: string, unpackDir: string, unpackFiles: string[]): Promise<void> {
    let zip: StreamZip.StreamZipAsync | null = null;
    try {
        zip = new StreamZip.async({ file: installer });
        for (const f of unpackFiles) {
            const fn = f.startsWith("/") ? f.slice(1) : f;
            const t = path.join(unpackDir, fn);
            console.debug(`Extracting installer file: ${fn}`);

            await fs.ensureDir(path.dirname(t));
            await zip.extract(fn, t);
        }
    } finally {
        await zip?.close();
    }
}

async function downloadMappings(profile: VersionProfile, target: string, control?: ProgressController) {
    const cm = profile.downloads.client_mappings;
    if (cm) {
        control?.onProgress?.(progress.indefinite("mappings"));

        console.debug(`Downloading mappings from: ${cm.url}`);

        await dlx.getAll([
            {
                path: target,
                url: cm.url,
                size: cm.size,
                sha1: cm.sha1,
                fastLink: false
            }
        ]);
    }
}

/**
 * Extracts the libraries bundled with the installer.
 */
async function extractLibraries(
    init: SmeltInstallInit,
    installer: string,
    container: Container,
    control?: ProgressController
): Promise<void> {
    const { signal, onProgress } = control ?? {};

    onProgress?.(progress.indefinite("forge-install.extract-libraries"));

    let zip: StreamZip.StreamZipAsync | null = null;

    try {
        zip = new StreamZip.async({ file: installer });

        for (const lib of init.installProfile.libraries) {
            if (!lib.url) {
                // This file is included in the archive, unpack it
                const m = new MavenName(lib.name);
                const src = `maven/${m.toPath()}`;
                const dst = container.library(lib.name);

                console.debug(`Extracting bundled library: ${src}`);

                await fs.ensureDir(path.dirname(dst));
                await zip.extract(src, dst);
            }

            signal?.throwIfAborted();
        }
    } finally {
        await zip?.close();
    }
}

async function downloadLibraries(init: SmeltInstallInit, container: Container, control?: ProgressController) {
    const { signal, onProgress } = control ?? {};

    const tasks: DlxDownloadRequest[] = init.installProfile.libraries
        .filter(lib => !!lib.downloads?.artifact?.url)
        .map(lib => ({
            ...lib.downloads!.artifact!,
            url: lib.downloads!.artifact!.url!,
            path: container.library(lib.name),
            fastLink: !!container.props.flags.link
        }));

    console.debug(`Resolving ${tasks.length} libraries for Forge.`);

    await dlx.getAll(tasks, { signal, onProgress: progress.makeNamed(onProgress, "forge-install.download-libraries") });
}

async function getMainClass(jar: string): Promise<string> {
    let zip: StreamZip.StreamZipAsync | null = null;
    try {
        zip = new StreamZip.async({ file: jar });
        const mf = (await zip.entryData("META-INF/MANIFEST.MF")).toString();
        for (const line of mf.split("\n")) {
            const [k, v] = line.split(": ").map(s => s.trim());
            if (k === "Main-Class" && !!v) {
                console.debug(`Main class of ${jar} is ${v}`);
                return v;
            }
        }

        throw `Could not determine main class of ${jar}`;
    } finally {
        await zip?.close();
    }
}

/**
 * Executes the processor JARs to finalize the installation.
 */
async function runProcessor(jrtExec: string, p: Processor, values: Map<string, string>, container: Container) {
    // Skip mappings download first
    const taskIndex = p.args.indexOf("--task");
    if (taskIndex >= 0 && p.args[taskIndex + 1] === "DOWNLOAD_MOJMAPS") {
        return;
    }

    if (p.sides && !p.sides.includes("client")) return; // Not needed on client

    const classpath = p.classpath.concat(p.jar).map(n => container.library(n)).join(path.delimiter);

    // The main class must be loaded from the archive in order to run it
    const mainClass = await getMainClass(container.library(p.jar));

    function applyValue(arg: string) {
        if (arg.startsWith("{") && arg.endsWith("}")) {
            return values.get(arg.slice(1, -1)) ?? arg;
        }

        if (arg.startsWith("[") && arg.endsWith("]")) {
            return container.library(arg.slice(1, -1));
        }

        return arg;
    }

    const args = p.args.map(applyValue);

    console.debug(`Executing Forge processor: ${p.jar} ${args.join(",")}`);

    const proc = child_process.spawn(jrtExec, [
        "-cp",
        classpath,
        mainClass,
        ...args
    ], { stdio: ["ignore", "inherit", "inherit"] });

    const code = await pEvent(proc, "exit");

    if (code !== 0) throw "Failed to execute processor";
}

async function runPostInstall(
    init: SmeltInstallInit,
    installer: string,
    profile: VersionProfile,
    container: Container,
    control?: ProgressController
) {
    const { signal, onProgress } = control ?? {};

    try {
        const unpackDir = paths.temp.to(`forge-work-${nanoid()}`);
        await fs.ensureDir(unpackDir);

        const [values, unpackFiles] = buildTemplateValues(init, installer, unpackDir, container);
        await unpackInstaller(installer, unpackDir, unpackFiles);

        signal?.throwIfAborted();

        await downloadMappings(profile, values.get("MOJMAPS")!, control);
        await extractLibraries(init, installer, container);
        await downloadLibraries(init, container, control);

        const jrtExec = jrt.executable(profile.javaVersion?.component ?? "jre-legacy");

        signal?.throwIfAborted();

        const prog: Progress = {
            state: "forge-install.processors",
            type: "count",
            value: {
                current: 0,
                total: init.installProfile.processors.length
            }
        };

        onProgress?.(prog);

        for (const p of init.installProfile.processors) {
            await runProcessor(jrtExec, p, values, container);
            signal?.throwIfAborted();

            prog.value.current++;
            onProgress?.(prog);
        }

        await fs.remove(unpackDir);

        console.debug("Forge installation completed.");
    } catch (e) {
        throw exceptions.create("forge-install-failed", { error: e });
    }
}

export const smelt = {
    readInstallProfile,
    deployVersionProfile,
    runPostInstall
};
