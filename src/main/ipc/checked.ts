import type { GameAuthResult } from "@/main/api/auth";
import type { CreateGameInit } from "@/main/api/game";
import type { LaunchGameResult } from "@/main/api/launcher";
import type { MpmAddonSearchResult } from "@/main/api/mpm";
import type { DetailedAccountProps } from "@/main/auth/types";
import type { UserConfig } from "@/main/conf/conf";
import { UnknownException } from "@/main/except/common";
import { AbstractException } from "@/main/except/exception";
import type { GameProfile } from "@/main/game/spec";
import type { VersionManifest } from "@/main/install/vanilla";
import type { MpmAddonType, MpmManifest } from "@/main/mpm/spec";
import { ipcMain } from "electron";

const handlers = new Map<string, Function>();

export interface CheckedIpcCommands {
    getGameProfile: (id: string) => GameProfile;
    getConfig: () => UserConfig;
    selectDir: () => string;
    listGames: () => GameProfile[];
    removeGame: (gameId: string) => void;
    querySharedGames: (id: string) => string[];
    launch: (id: string) => LaunchGameResult;
    gameAuth: (gameId: string, pwd?: string) => GameAuthResult;
    listAccounts: () => DetailedAccountProps[];
    createVanillaAccount: () => DetailedAccountProps;
    createYggdrasilAccount: (host: string, email: string, pwd: string) => DetailedAccountProps;
    addGame: (game: CreateGameInit) => string;
    updateGame: (game: GameProfile) => void;
    getVersionManifest: () => VersionManifest;
    queryAvailableModLoaders: (gameVersion: string) => string[];
    loadMpmManifest: (gameId: string) => MpmManifest;
    searchAddons: (scope: MpmAddonType, query: string, gameId: string, pagination: any) => MpmAddonSearchResult;
    updateAddons: (gameId: string) => void;
    addAddons: (gameId: string, specs: string[]) => void;
    removeAddons: (gameId: string, specs: string[]) => void;
    getAccountSkin: (accountId: string) => string;
    getAccountSkinAvatar: (accountId: string) => [string, string];
    scanImportableProfiles: (root: string) => string[];
    importGame: (name: string, root: string, profileId: string, accountId: string) => void;
}

type OptionalPromise<T> = T | Promise<T>;

interface InvocationPayload<K extends keyof CheckedIpcCommands> {
    method: K;
    args: Parameters<CheckedIpcCommands[K]>;
}

class NoHandlerRegisteredException extends AbstractException<"no-handler-registered"> {
    #method: string;

    constructor(method: string) {
        super("no-handler-registered", { method });
        this.#method = method;
    }

    toString(): string {
        return `No handler registered for IPC method ${this.#method}`;
    }
}

ipcMain.handle("checkedInvoke", async (_, payload: InvocationPayload<any>) => {
    const handler = handlers.get(payload.method);
    if (!handler) {
        return {
            success: false,
            error: new NoHandlerRegisteredException(payload.method).toJSON()
        };
    }

    try {
        const v = await handler(...payload.args);
        return {
            success: true,
            value: v
        };
    } catch (e) {
        console.error(`Error occurred in handler ${payload.method}:`);
        console.error(e);

        if (!(e instanceof AbstractException)) {
            e = new UnknownException(e);
        }

        return {
            success: false,
            error: (e as AbstractException).toJSON()
        };
    }
});

export function addCheckedHandler<K extends keyof CheckedIpcCommands>(
    method: K,
    handler: (...args: Parameters<CheckedIpcCommands[K]>) => OptionalPromise<ReturnType<CheckedIpcCommands[K]>>
) {
    handlers.set(method, handler);
}
