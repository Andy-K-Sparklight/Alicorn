import type { LaunchGameResult } from "@/main/api/launcher";
import type { UserConfig } from "@/main/conf/conf";
import type { GameProfile, GameProfileDetail } from "@/main/game/spec";
import { type IpcCommands, type IpcEvents } from "@/main/ipc/channels";
import type { TypedIpcRenderer } from "@/main/ipc/typed";
import { contextBridge, ipcRenderer as ipcRendererRaw } from "electron";

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
        }
    },

    /**
     * Authentication operations.
     */
    auth: {
        /**
         * Refreshes the account of the given game.
         */
        refresh(id: string): Promise<boolean> {
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
        async subscribe(procId: string): Promise<void> {
            ipcRenderer.send("subscribeGameEvents", procId);
            const port = await new Promise(res =>
                ipcRendererRaw.once(`dispatchGameEvents:${procId}`, (e) => res(e.ports[0]))
            ) as MessagePort;

            // Event targets cannot be transferred through the context bridge.
            // We send a port with events forwarded and let the renderer rebuild the event target.
            window.postMessage(`dispatchGameEventsRemote:${procId}`, "*", [port]);
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
