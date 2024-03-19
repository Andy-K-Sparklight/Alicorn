import { ipcRenderer } from "electron";
import EventEmitter from "events";
import { whereAJ } from "../auth/AJHelper";
import { whereND } from "../auth/NDHelper";
import { Pair } from "../commons/Collections";
import { isNull } from "../commons/Null";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { GameProfile } from "../profile/GameProfile";
import { setDirtyProfile } from "../readyboom/PrepareProfile";
import {
    applyAJ,
    applyMemory,
    applyND,
    applyResolution,
    applyScheme,
    applyServer,
    generateGameArgs,
    generateVMArgs
} from "./ArgsGenerator";
import { runMinecraft } from "./MinecraftBootstrap";

// Launch and return ID
export function launchProfile(
    profile: GameProfile,
    container: MinecraftContainer,
    jExecutable: string,
    authData: [string, string, string, string],
    emitter: EventEmitter,
    policies: {
        useAj?: boolean;
        resolution?: Pair<number, number>;
        ajHost?: string;
        useServer?: boolean;
        server?: string;
        ajPrefetch?: string;
        useNd?: boolean;
        ndServerId?: string;
        javaVersion?: number;
        gc1?: string;
        gc2?: string;
        maxMem?: number;
        demo?: boolean;
        isolated?: boolean;
    }
): string {
    const vmArgs = generateVMArgs(profile, container);
    const gameArgs = generateGameArgs(
        profile,
        container,
        authData,
        !!policies.demo,
        !!policies.isolated
    );
    const ajArgs = policies.useAj
        ? applyAJ(whereAJ(), policies.ajHost || "", policies.ajPrefetch || "")
        : [];
    const ndArgs = policies.useNd
        ? applyND(whereND(), policies.ndServerId || "")
        : [];
    const resolutions = !isNull(policies.resolution)
        ? applyResolution(
            policies.resolution?.getFirstValue(),
            policies.resolution?.getSecondValue()
        )
        : [];
    const serverArgs = policies.useServer
        ? applyServer(policies.server || "")
        : [];

    let memArgs: string[] = [];
    if (policies.javaVersion && policies.gc1 && policies.gc2) {
        memArgs = applyScheme(policies.gc1, policies.gc2, policies.javaVersion);
    }
    memArgs = memArgs.concat(applyMemory(policies.maxMem || 0));
    let totalArgs: string[];
    // I write this judge here in case of you still call ND and AJ both
    if (policies.useNd) {
        totalArgs = ndArgs
            .concat(memArgs)
            .concat(vmArgs)
            .concat(gameArgs)
            .concat(serverArgs)
            .concat(resolutions);
    } else {
        totalArgs = ajArgs
            .concat(memArgs)
            .concat(vmArgs)
            .concat(gameArgs)
            .concat(serverArgs)
            .concat(resolutions);
    }

    const ir = policies.isolated
        ? container.getVersionRoot(profile.id)
        : container.rootDir;

    process.chdir(ir);
    ipcRenderer.send("changeDir", ir);

    console.log(totalArgs);
    return runMinecraft(totalArgs, jExecutable, container, ir, emitter);
}

const SAFE_LAUNCH_SET: Set<string> = new Set();

export function shouldSafeLaunch(container: string, id: string): boolean {
    return SAFE_LAUNCH_SET.has(container + "/" + id);
}

export function markSafeLaunch(
    container: string,
    id: string,
    add = true
): void {
    if (add) {
        SAFE_LAUNCH_SET.add(container + "/" + id);
        setDirtyProfile(container, id);
    } else {
        SAFE_LAUNCH_SET.delete(container + "/" + id);
    }
}
