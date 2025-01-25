import type { IpcCommands, IpcEvents } from "@/main/ipc/channels";
import {
    ipcMain as ipcMainRaw,
    type IpcMain,
    type IpcMainEvent,
    type IpcMainInvokeEvent,
    type IpcRenderer,
    type IpcRendererEvent
} from "electron";

type OptionalPromise<T> = T | Promise<T>;
type InputMap = {
    [key: string]: (...args: any) => any;
};

export interface TypedIpcMain<
    IpcEvents extends InputMap,
    IpcCommands extends InputMap
> extends IpcMain {
    on<K extends keyof IpcEvents>(
        channel: K,
        listener: (event: IpcMainEvent, ...args: Parameters<IpcEvents[K]>) => void
    ): this;

    once<K extends keyof IpcEvents>(
        channel: K,
        listener: (event: IpcMainEvent, ...args: Parameters<IpcEvents[K]>) => void
    ): this;

    removeListener<K extends keyof IpcEvents>(
        channel: K,
        listener: (event: IpcMainEvent, ...args: Parameters<IpcEvents[K]>) => void
    ): this;

    removeAllListeners<K extends keyof IpcEvents>(channel?: K): this;

    handle<K extends keyof IpcCommands>(
        channel: K,
        listener: (
            event: IpcMainInvokeEvent,
            ...args: Parameters<IpcCommands[K]>
        ) => OptionalPromise<ReturnType<IpcCommands[K]>>
    ): void;

    handleOnce<K extends keyof IpcCommands>(
        channel: K,
        listener: (
            event: IpcMainInvokeEvent,
            ...args: Parameters<IpcCommands[K]>
        ) => OptionalPromise<ReturnType<IpcCommands[K]>>
    ): void;

    removeHandler<K extends keyof IpcCommands>(channel: K): void;
}

export interface TypedIpcRenderer<
    IpcEvents extends InputMap,
    IpcCommands extends InputMap
> extends IpcRenderer {
    on<K extends keyof IpcEvents>(
        channel: K,
        listener: (
            event: IpcRendererEvent,
            ...args: Parameters<IpcEvents[K]>
        ) => void
    ): this;

    once<K extends keyof IpcEvents>(
        channel: K,
        listener: (
            event: IpcRendererEvent,
            ...args: Parameters<IpcEvents[K]>
        ) => void
    ): this;

    removeListener<K extends keyof IpcEvents>(
        channel: K,
        listener: (
            event: IpcRendererEvent,
            ...args: Parameters<IpcEvents[K]>
        ) => void
    ): this;

    removeAllListeners<K extends keyof IpcEvents>(channel?: K): this;

    send<K extends keyof IpcEvents>(
        channel: K,
        ...args: Parameters<IpcEvents[K]>
    ): void;

    sendSync<K extends keyof IpcEvents>(
        channel: K,
        ...args: Parameters<IpcEvents[K]>
    ): ReturnType<IpcEvents[K]>;

    sendTo<K extends keyof IpcEvents>(
        webContentsId: number,
        channel: K,
        ...args: Parameters<IpcEvents[K]>
    ): void;

    sendToHost<K extends keyof IpcEvents>(
        channel: K,
        ...args: Parameters<IpcEvents[K]>
    ): void;

    invoke<K extends keyof IpcCommands>(
        channel: K,
        ...args: Parameters<IpcCommands[K]>
    ): Promise<ReturnType<IpcCommands[K]>>;
}

export const ipcMain = ipcMainRaw as TypedIpcMain<IpcEvents, IpcCommands>;
