import type { GameAuthResult } from "@/main/api/auth";
import type { CreateGameInit } from "@/main/api/game";
import type { LaunchGameResult } from "@/main/api/launcher";
import type { MpmAddonSearchResult } from "@/main/api/mpm";
import type { DetailedAccountProps } from "@/main/auth/types";
import type { UserConfig } from "@/main/conf/conf";
import type { SerializedException } from "@/main/except/exception";
import type { GameProfile } from "@/main/game/spec";
import type { VersionManifest } from "@/main/install/vanilla";
import { type IpcCallEvents, type IpcCommands, type IpcMessageEvents, type IpcPushEvents } from "@/main/ipc/channels";
import type { CheckedIpcCommands } from "@/main/ipc/checked";
import type { TypedIpcRenderer } from "@/main/ipc/typed";
import type { MpmAddonType, MpmManifest } from "@/main/mpm/spec";
import { contextBridge, ipcRenderer as ipcRendererRaw } from "electron";
import Emittery from "emittery";
import { exposePort } from "./message";

console.log("Enabling preload script.");

const ipcRenderer = ipcRendererRaw as TypedIpcRenderer<IpcCallEvents, IpcPushEvents, IpcMessageEvents, IpcCommands>;
const internalEvents = new Emittery();

const native = {
    /**
     * App operations.
     */
    app: {
        /**
         * Gets notified when app has been upgraded.
         */
        onUpgraded(handler: (version: string) => void) {
            ipcRenderer.on("appUpgraded", (_, v) => handler(v));
        }
    },

    /**
     * Window control methods.
     */
    bwctl: {
        /**
         * Makes the window visible.
         */
        show(): void {
            ipcRenderer.send("showWindow");
        },

        /**
         * Makes the window no longer visible.
         */
        hide(): void {
            ipcRenderer.send("hideWindow");
        },

        /**
         * Closes the window.
         */
        close(): void {
            ipcRenderer.send("closeWindow");
        },

        /**
         * Minimizes the window.
         */
        minimize(): void {
            ipcRenderer.send("minimizeWindow");
        },

        /**
         * Sets the zoom factor.
         */
        setZoom(v: number): void {
            ipcRenderer.send("setZoom", v);
        }
    },

    /**
     * Game installation operations.
     */
    install: {
        /**
         * Run game installer.
         */
        installGame(gameId: string): void {
            const ch = new MessageChannel();
            ipcRenderer.postMessage("installGame", gameId, [ch.port2]);
            exposePort(gameId, ch.port1);
        },

        /**
         * Cancels existing installation process.
         */
        cancel(gameId: string): void {
            ipcRenderer.send("cancelInstall", gameId);
        },

        queryAvailableModLoaders(gameVersion: string): Promise<string[]> {
            return ipcRenderer.invoke("queryAvailableModLoaders", gameVersion);
        }
    },

    /**
     * Game profile managements.
     */
    game: {
        /**
         * Get all available game profiles.
         */
        list(): Promise<GameProfile[]> {
            return ipcRenderer.invoke("listGames");
        },

        /**
         * Reveals the given scope in the game directory.
         */
        reveal(gameId: string, scope: string): void {
            ipcRenderer.send("revealGameContent", gameId, scope);
        },

        /**
         * Removes the specified game.
         * @param gameId
         */
        remove(gameId: string): Promise<void> {
            return ipcRenderer.invoke("removeGame", gameId);
        },

        /**
         * Adds the specified game to registry.
         */
        add(game: CreateGameInit): Promise<string> {
            return ipcRenderer.invoke("addGame", game);
        },

        /**
         * Gets the game profile of the specified ID.
         */
        getProfile(id: string): Promise<GameProfile> {
            return checkedInvoke("getGameProfile", id);
        },

        /**
         * Checks whether the game profile is being shared with other games.
         */
        queryShared(id: string): Promise<string[]> {
            return ipcRenderer.invoke("querySharedGames", id);
        },

        /**
         * Updates the specified game profile.
         */
        update(g: GameProfile) {
            return ipcRenderer.invoke("updateGame", g);
        },

        /**
         * Destroys the specified game.
         */
        destroy(id: string) {
            ipcRenderer.send("destroyGame", id);
        },


        /**
         * Scans the given directory for importable profiles.
         */
        scanImportableProfiles(root: string): Promise<string[]> {
            console.log(root);
            return ipcRenderer.invoke("scanImportableProfiles", root);
        },

        /**
         * Imports the specified game.
         */
        importGame(name: string, root: string, profileId: string, accountId: string) {
            return ipcRenderer.invoke("importGame", name, root, profileId, accountId);
        },

        /**
         * Adds a listener for game changes.
         */
        onChange(fn: () => void) {
            internalEvents.on("gameChanged", fn);
        }
    },

    /**
     * Authentication operations.
     */
    auth: {
        /**
         * Authenticate the account of the specified game.
         */
        forGame(id: string, pwd?: string): Promise<GameAuthResult> {
            return ipcRenderer.invoke("gameAuth", id, pwd);
        },

        /**
         * Gets all accounts stored in the registry.
         */
        getAccounts(): Promise<DetailedAccountProps[]> {
            return ipcRenderer.invoke("listAccounts");
        },

        /**
         * Creates a new vanilla account.
         */
        createVanilla(): Promise<DetailedAccountProps> {
            return ipcRenderer.invoke("createVanillaAccount");
        },

        /**
         * Creates an Yggdrasil account.
         */
        createYggdrasil(host: string, email: string, pwd: string): Promise<DetailedAccountProps> {
            return ipcRenderer.invoke("createYggdrasilAccount", host, email, pwd);
        },

        /**
         * Queries the skin of the given account.
         */
        getSkin(accountId: string): Promise<string> {
            return ipcRenderer.invoke("getAccountSkin", accountId);
        },

        /**
         * Like `getSkin`, but crops the section corresponding to the avatar for displaying.
         */
        getSkinAvatar(accountId: string): Promise<[string, string]> {
            return ipcRenderer.invoke("getAccountSkinAvatar", accountId);
        },

        /**
         * Gets notified when accounts have changed.
         */
        onAccountChange(fn: () => void) {
            internalEvents.on("accountChanged", fn);
        }
    },

    /**
     * Launcher and game instance managements.
     */
    launcher: {
        /**
         * Launches the game using the given launch hint.
         */
        launch(gameId: string): Promise<LaunchGameResult> {
            return ipcRenderer.invoke("launch", gameId);
        },

        /**
         * Forwards game events port received from the main process into the main world.
         */
        subscribe(procId: string): void {
            const ch = new MessageChannel();
            ipcRenderer.postMessage("subscribeGameEvents", procId, [ch.port2]);
            exposePort(procId, ch.port1);
        },

        /**
         * Terminates the given game.
         */
        stop(procId: string): void {
            ipcRenderer.send("stopGame", procId);
        },

        /**
         * Detaches the given game.
         */
        remove(procId: string): void {
            ipcRenderer.send("removeGame", procId);
        }
    },

    /**
     * Operation related with fetching external manifests.
     */
    sources: {
        /**
         * Retrieves the base game version manifest.
         */
        getVersionManifest(): Promise<VersionManifest> {
            return ipcRenderer.invoke("getVersionManifest");
        }
    },

    /**
     * Addon resolving operations.
     */
    mpm: {
        /**
         * Searches for addons.
         */
        searchAddons(scope: MpmAddonType, query: string, gameId: string, pg?: unknown): Promise<MpmAddonSearchResult> {
            return ipcRenderer.invoke("searchAddons", scope, query, gameId, pg);
        },

        /**
         * Updates the addons installed.
         */
        updateAddons(gameId: string): Promise<void> {
            return ipcRenderer.invoke("updateAddons", gameId);
        },

        /**
         * Adds the specified addons to the game.
         */
        addAddons(gameId: string, specs: string[]): Promise<void> {
            return ipcRenderer.invoke("addAddons", gameId, specs);
        },

        /**
         * Removes the specified addons from the game.
         */
        removeAddons(gameId: string, specs: string[]): Promise<void> {
            return ipcRenderer.invoke("removeAddons", gameId, specs);
        },

        /**
         * Loads MPM manifest.
         */
        loadManifest(gameId: string): Promise<MpmManifest> {
            return ipcRenderer.invoke("loadMpmManifest", gameId);
        },

        /**
         * Gets notified when MPM manifest changes.
         */
        onManifestChange(fn: (gameId: string, manifest: MpmManifest) => void) {
            internalEvents.on("mpmManifestChanged", ({ id, mf }) => fn(id, mf));
        }
    },

    /**
     * Configuration sync methods.
     */
    conf: {
        get(): Promise<UserConfig> {
            return ipcRenderer.invoke("getConfig");
        },

        update(conf: UserConfig): void {
            ipcRenderer.send("updateConfig", conf);
        },

        onChange(cb: (c: UserConfig) => void): void {
            internalEvents.on("configChanged", args => cb(args[0]));
        }
    },

    /**
     * Misc operations.
     */
    ext: {
        /**
         * Opens a URL in external browser.
         */
        openURL(url: string): void {
            ipcRenderer.send("openUrl", url);
        },

        /**
         * Selects a directory.
         */
        selectDir(): Promise<string> {
            return ipcRenderer.invoke("selectDir");
        },

        /**
         * Sends current language value to the main process.
         */
        updateLanguage(lang: string): void {
            ipcRenderer.send("languageChange", lang);
        },

        /**
         * Gets notified when DevTools is opened.
         */
        onDevToolsOpened(handler: () => void) {
            internalEvents.on("devToolsOpened", handler);
        }
    }
};

// Unwraps IPC events as internal events
(["gameChanged", "accountChanged", "configChanged", "devToolsOpened"] as const).forEach(ch => {
    ipcRenderer.on(ch, (_, ...args) => {
        void internalEvents.emit(ch, args);
    });
});

ipcRenderer.on("mpmManifestChanged", (_, id, mf) => {
    void internalEvents.emit("mpmManifestChanged", { id, mf });
});


contextBridge.exposeInMainWorld("native", native);

console.log("Completed native API bindings.");

export type NativeAPI = typeof native;

type Optional<T> = {
    success: true;
    value: T;
} | {
    success: false;
    error: string;
}

async function checkedInvoke<K extends keyof CheckedIpcCommands>(
    method: K,
    ...args: Parameters<CheckedIpcCommands[K]>
): Promise<ReturnType<CheckedIpcCommands[K]>> {
    const res = await ipcRendererRaw.invoke("checkedInvoke", {
        method,
        args
    }) as Optional<ReturnType<CheckedIpcCommands[K]>>;

    if (res.success) {
        return res.value;
    } else {
        throw JSON.parse(res.error) as SerializedException<any>;
    }
}
