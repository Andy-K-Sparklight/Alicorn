/**
 * The bootloader system.
 */
import { accounts } from "@/main/auth/manage";
import { YggdrasilAccount } from "@/main/auth/yggdrasil";
import { NoSuchElementException } from "@/main/except/common";
import { jrt } from "@/main/jrt/install";
import { launchArgs } from "@/main/launch/args";
import { GameProcess } from "@/main/launch/proc";
import { LaunchHint, LaunchInit } from "@/main/launch/types";
import { venv } from "@/main/launch/venv";
import { profileLoader } from "@/main/profile/loader";
import { net } from "electron";
import { containers } from "../container/manage";

const games = new Map<string, GameProcess>();

/**
 * Loads necessary information from the launch hint profile and builds launch init params.
 */
async function prepare(hint: LaunchHint): Promise<LaunchInit> {
    const container = containers.get(hint.containerId);

    let originalRoot = container.props.root;

    // In case this container has already been mounted when launching
    if (hint.venv) {
        container.props.root = await venv.getCurrentRoot(container);
    }

    const profile = await profileLoader.fromContainer(hint.profileId, container);
    const account = accounts.get(hint.accountId);
    const assetsShouldMap = await profileLoader.assetIndexShouldMap(profile.assetIndex.id, container);

    const authlibInjectorHost = account instanceof YggdrasilAccount ? account.host : undefined;
    const authlibInjectorPrefetch = authlibInjectorHost && await prefetchAuthlibInjectorMeta(authlibInjectorHost);

    const enabledFeatures = new Set<string>();
    // Add custom resolution flag if applicable
    const window = hint.pref.window;
    if (window && window.width > 0 && window.height > 0) {
        enabledFeatures.add("has_custom_resolution");
    }

    const jrtExec = hint.pref.alterJRTExec || jrt.executable(profile.javaVersion?.component || "jre-legacy");

    container.props.root = originalRoot;

    return {
        profile,
        container,
        jrtExec,
        credentials: account.credentials(),
        enabledFeatures,
        assetsShouldMap,
        pref: hint.pref,
        extraVMArgs: [],
        extraClasspath: [],
        authlibInjectorHost,
        authlibInjectorPrefetch
    };
}

async function launch(hint: LaunchHint): Promise<GameProcess> {
    console.log(`Launching game ${hint.profileId} on ${hint.containerId}`);
    const init = await prepare(hint);

    if (hint.venv) {
        await venv.mount(init.container);
        init.extraVMArgs.push(...venv.createVenvArgs(init.container));
    }

    try {
        const args = launchArgs.createArguments(init);
        const g = await GameProcess.create(init.jrtExec, args, init.container.gameDir());
        games.set(g.id, g);

        if (hint.venv) {
            g.emitter.once("end", () => venv.unmount(init.container));
        }

        return g;
    } catch (e) {
        if (hint.venv) {
            await venv.unmount(init.container);
        }
        throw e;
    }
}

async function prefetchAuthlibInjectorMeta(url: string): Promise<string> {
    try {
        const res = await net.fetch(url);
        return Buffer.from(await res.arrayBuffer()).toString("base64");
    } catch {
        return "";
    }
}

function getInstance(gid: string): GameProcess {
    const g = games.get(gid);
    if (!g) throw new NoSuchElementException(gid);
    return g;
}

function removeInstance(gid: string): void {
    const g = games.get(gid);
    games.delete(gid);
    g?.detach();
}

function removeAll(): void {
    games.forEach(g => g.detach());
    games.clear();
}

export const bl = { launch, getInstance, removeInstance, removeAll };
