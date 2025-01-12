/**
 * The bootloader system.
 */
import { jrt } from "@/main/jrt/install";
import { launchArgs } from "@/main/launch/args";
import { GameInstance, proc } from "@/main/launch/proc";
import { LaunchHint, LaunchInit } from "@/main/launch/types";
import { profileLoader } from "@/main/profile/loader";
import { reg } from "@/main/registry/registry";

/**
 * Loads necessary information from the launch hint profile and builds launch init params.
 */
async function prepare(hint: LaunchHint): Promise<LaunchInit> {
    const container = reg.containers.get(hint.containerId);
    const profile = await profileLoader.fromContainer(hint.profileId, container);
    const account = reg.accounts.get(hint.accountId);
    const assetsShouldMap = await profileLoader.assetIndexShouldMap(profile.assetIndex.id, container);

    const enabledFeatures = new Set<string>();
    // Add custom resolution flag if applicable
    const window = hint.pref.window;
    if (window && window.width > 0 && window.height > 0) {
        enabledFeatures.add("has_custom_resolution");
    }

    const jrtExec = hint.pref.alterJRTExec || jrt.executable(profile.javaVersion?.component || "jre-legacy");

    return {
        profile,
        container,
        jrtExec,
        credentials: account.credentials(),
        enabledFeatures,
        assetsShouldMap,
        pref: hint.pref
    };
}

async function launch(hint: LaunchHint): Promise<GameInstance> {
    const init = await prepare(hint);
    const args = launchArgs.createArguments(init);
    return proc.newGameProc(init.jrtExec, args, init.container.gameDir());
}

export const bl = { launch };

