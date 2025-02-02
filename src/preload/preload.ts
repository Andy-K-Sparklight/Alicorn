import type { CreateGameInit } from "@/main/api/game";
import type { LaunchGameResult } from "@/main/api/launcher";
import type { UserConfig } from "@/main/conf/conf";
import type { GameProfile, GameProfileDetail } from "@/main/game/spec";
import type { VersionManifest } from "@/main/install/vanilla";
import { type IpcCommands, type IpcEvents } from "@/main/ipc/channels";
import type { TypedIpcRenderer } from "@/main/ipc/typed";
import { contextBridge, ipcRenderer as ipcRendererRaw } from "electron";
import { exposePort } from "./message";

console.log("Enabling preload script.");

const ipcRenderer = ipcRendererRaw as TypedIpcRenderer<IpcEvents, IpcCommands>;

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
         * Gets detailed information for the given game.
         */
        tell(gameId: string): Promise<GameProfileDetail> {
            return ipcRenderer.invoke("tellGame", gameId);
        },

        /**
         * Reveals the given scope in the game directory.
         */
        reveal(gameId: string, scope: string): void {
            ipcRenderer.send("revealGameContent", gameId, scope);
        },

        /**
         * Adds the specified game to registry.
         */
        add(game: CreateGameInit): Promise<void> {
            return ipcRenderer.invoke("addGame", game);
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
        }
    }
};

contextBridge.exposeInMainWorld("native", native);

console.log("Completed native API bindings.");

export type NativeAPI = typeof native;
