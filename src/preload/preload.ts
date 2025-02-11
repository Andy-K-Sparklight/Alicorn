import type { CreateGameInit } from "@/main/api/game";
import type { LaunchGameResult } from "@/main/api/launcher";
import type { DetailedAccountProps } from "@/main/auth/types";
import type { UserConfig } from "@/main/conf/conf";
import type { GameProfile } from "@/main/game/spec";
import type { VersionManifest } from "@/main/install/vanilla";
import { type IpcCallEvents, type IpcCommands, type IpcMessageEvents, type IpcPushEvents } from "@/main/ipc/channels";
import type { TypedIpcRenderer } from "@/main/ipc/typed";
import { contextBridge, ipcRenderer as ipcRendererRaw } from "electron";
import Emittery from "emittery";
import { exposePort } from "./message";

console.log("Enabling preload script.");

const ipcRenderer = ipcRendererRaw as TypedIpcRenderer<IpcCallEvents, IpcPushEvents, IpcMessageEvents, IpcCommands>;
const internalEvents = new Emittery();

const native = {
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
        }
    },

    /**
     * Game installation operations.
     */
    install: {
        /**
         * Install vanilla game.
         */
        installVanilla(gameId: string): void {
            const ch = new MessageChannel();
            ipcRenderer.postMessage("installVanilla", gameId, [ch.port2]);
            exposePort(gameId, ch.port1);
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
         * Renames the game.
         */
        rename(gameId: string, newName: string): Promise<void> {
            return ipcRenderer.invoke("renameGame", gameId, newName);
        },

        /**
         * Adds the specified game to registry.
         */
        add(game: CreateGameInit): Promise<void> {
            return ipcRenderer.invoke("addGame", game);
        },

        /**
         * Gets the game profile of the specified ID.
         */
        getProfile(id: string): Promise<GameProfile> {
            return ipcRenderer.invoke("getGameProfile", id);
        },

        /**
         * Sets alternative JRT to run the game.
         */
        setAlterJRT(id: string, fp: string) {
            return ipcRenderer.invoke("setAlterJRT", id, fp);
        },

        /**
         * Adds a listener for game changes.
         */
        onChange(fn: () => void) {
            internalEvents.on("gameChanged", fn);
        },

        /**
         * Removes previously added listener.
         */
        offChange(fn: () => void) {
            internalEvents.off("gameChanged", fn);
        }
    },

    /**
     * Authentication operations.
     */
    auth: {
        /**
         * Authenticate the account of the specified game.
         */
        forGame(id: string): Promise<boolean> {
            return ipcRenderer.invoke("gameAuth", id);
        },

        /**
         * Gets all accounts stored in the registry.
         */
        getAccounts(): Promise<DetailedAccountProps[]> {
            return ipcRenderer.invoke("listAccounts");
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
     * Configuration sync methods.
     */
    conf: {
        get(): Promise<UserConfig> {
            return ipcRenderer.invoke("getConfig");
        },

        update(conf: UserConfig): void {
            ipcRenderer.send("updateConfig", conf);
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
        }
    }
};

// Unwraps IPC events as internal events
(["gameChanged"] as const).forEach(ch => {
    ipcRenderer.on(ch, (_, ...args) => {
        void internalEvents.emit(ch, args);
    });
});

contextBridge.exposeInMainWorld("native", native);

console.log("Completed native API bindings.");

export type NativeAPI = typeof native;
