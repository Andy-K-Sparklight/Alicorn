import type { UserConfig } from "@/main/conf/conf";
import type { GameProfile, GameSummary } from "@/main/game/spec";
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
        tell(gameId: string): Promise<GameSummary> {
            return ipcRenderer.invoke("tellGame", gameId);
        }
    },

    /**
     * Launcher and game instance managements.
     */
    launcher: {
        /**
         * Launches the game using the given launch hint.
         */
        launch(launchHintId: string): Promise<string> {
            return ipcRenderer.invoke("launch", launchHintId);
        },

        /**
         * Creates an event target to receive events from the game.
         */
        async subscribe(gameId: string): Promise<EventTarget> {
            ipcRenderer.send("subscribeGameEvents", gameId);
            const port = await new Promise(res =>
                ipcRendererRaw.once(`feedGameEvents:${gameId}`, (e) => res(e.ports[0]))
            ) as MessagePort;

            const et = new EventTarget();
            port.onmessage = (e) => {
                const { channel, args } = e.data;
                et.dispatchEvent(new CustomEvent(channel, { detail: args }));
            };

            return et;
        },

        /**
         * Terminates the given game.
         */
        stop(gameId: string): void {
            ipcRenderer.send("stopGame", gameId);
        },

        /**
         * Detaches the given game.
         */
        remove(gameId: string): void {
            ipcRenderer.send("removeGame", gameId);
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
