/**
 * Argument creation module.
 */
import { conf } from "@/main/conf/conf";
import { LaunchInit } from "@/main/launch/types";
import { MavenName } from "@/main/profile/maven-name";
import { filterRules } from "@/main/profile/rules";
import type { Library } from "@/main/profile/version-profile";
import { isTruthy } from "@/main/util/misc";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pkg from "~/package.json";

function createClasspath(init: LaunchInit): string {
    const validLibs = init.profile.libraries.filter(lib => filterRules(lib.rules, init.enabledFeatures));

    // Mod loaders can override existing libraries by providing a later version
    // If there appears two libraries with the same name except the version
    // We'll ignore the second one as libraries are prepended
    const existingNames = new Set<string>();

    const uniqueLibs: Library[] = [];
    for (const lib of validLibs) {
        const m = new MavenName(lib.name);
        const identifyTriple = [m.group, m.artifact, m.classifier].join(":");
        if (existingNames.has(identifyTriple)) {
            continue;
        }

        existingNames.add(identifyTriple);
        uniqueLibs.push(lib);
    }


    const libs = uniqueLibs.map(lib => init.container.library(lib.name));

    // Add client.jar
    libs.push(init.container.client(init.profile.version || init.profile.id));

    libs.unshift(...init.extraClasspath ?? []);

    return libs.join(path.delimiter);
}

function createTemplateValues(init: LaunchInit): Map<string, string> {
    const { profile, container, credentials, pref: { window } } = init;
    const va = new Map<string, string>();

    const legacyAssetsRoot = init.assetsShouldMap ?
        container.assetsRootMapped() :
        container.assetsRootLegacy(profile.assets);

    const nativesRoot = container.nativesRoot(profile.version || profile.id);

    va.set("version_name", profile.version);
    va.set("game_directory", container.gameDir());
    va.set("auth_player_name", credentials.playerName);
    va.set("assets_root", container.assetsRoot());
    va.set("assets_index_name", profile.assets);
    va.set("version_type", profile.type);

    va.set("auth_uuid", credentials.uuid);
    va.set("auth_session", credentials.accessToken);
    va.set("auth_access_token", credentials.accessToken);
    va.set("user_type", "mojang");
    va.set("clientid", conf().client.id);
    va.set("auth_xuid", credentials.xboxId);
    va.set("user_properties", "[]");
    va.set("game_assets", legacyAssetsRoot);

    va.set("launcher_name", "Alicorn");
    va.set("launcher_version", pkg.version);
    va.set("natives_directory", nativesRoot);
    va.set("library_directory", container.librariesRoot());
    va.set("classpath_separator", path.delimiter);
    va.set("classpath", createClasspath(init));

    if (window) {
        va.set("resolution_width", window.width.toString());
        va.set("resolution_height", window.height.toString());
    }

    return va;
}

function createMemoryArgs(init: LaunchInit): string[] {
    if (!init.pref.memory) return [];

    const { min, max } = init.pref.memory;

    return [
        min > 0 && `-Xms${min}M`,
        max > 0 && `-Xmx${max}M`
    ].filter(isTruthy);
}

function createWindowSizeArgs(init: LaunchInit): string[] {
    // Resolution args has been included in the profile since 1.13
    if (init.profile.complianceLevel >= 1 || !init.pref.window) return [];

    const { width, height } = init.pref.window;
    if (width > 0 && height > 0) {
        return [
            "--width",
            width.toString(),
            "--height",
            height.toString()
        ];
    }

    return [];
}

function createArguments(init: LaunchInit): string[] {
    const va = createTemplateValues(init);

    const [gameArgs, vmArgs] = [init.profile.arguments.game, init.profile.arguments.jvm]
        .map((al) =>
            al.filter(a => typeof a === "string" || filterRules(a.rules, init.enabledFeatures))
                .flatMap(a => typeof a === "string" ? a : a.value)
        );

    if (init.profile.logging?.client) {
        const { argument, file } = init.profile.logging.client;
        const loggingConfigPath = init.container.loggingConfig(file.id);
        const loggingArg = argument.replaceAll("${path}", pathToFileURL(loggingConfigPath).toString());
        vmArgs.push(
            loggingArg,
            "-Dlog4j2.formatMsgNoLookups=true",
            "-Dcom.sun.jndi.rmi.object.trustURLCodebase=false",
            "-Dcom.sun.jndi.cosnaming.object.trustURLCodebase=false"
        );
    }

    const { vm: globalExtraVM, game: globalExtraGame } = conf().runtime.args;
    const { vm: localExtraVM, game: localExtraGame } = init.pref.args ?? { vm: [], game: [] };

    const extraVMArgs = [
        ...createMemoryArgs(init),
        ...localExtraVM,
        ...globalExtraVM,
        ...init.extraVMArgs ?? []
    ];

    const extraGameArgs = [
        ...createWindowSizeArgs(init),
        ...localExtraGame,
        ...globalExtraGame
    ];

    return [
        ...vmArgs,
        ...extraVMArgs,
        init.altMainClass || init.profile.mainClass,
        ...gameArgs,
        ...extraGameArgs
    ].map(a => {
        let r = a;
        for (const [k, v] of va) {
            r = r.replaceAll("${" + k + "}", v);
        }
        return r;
    });
}

export const launchArgs = {
    createArguments
};
