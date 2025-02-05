import type { IpcCallEvents, IpcCommands, IpcMessageEvents } from "@/main/ipc/channels";
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
    CallEvents extends InputMap,
    PushEvents extends InputMap,
    MessageEvents extends InputMap,
    Commands extends InputMap
> extends IpcRenderer {
    on<K extends keyof PushEvents>(
        channel: K,
        listener: (
            event: IpcRendererEvent,
            ...args: Parameters<PushEvents[K]>
        ) => void
    ): this;

    once<K extends keyof PushEvents>(
        channel: K,
        listener: (
            event: IpcRendererEvent,
            ...args: Parameters<PushEvents[K]>
        ) => void
    ): this;

    removeListener<K extends keyof PushEvents>(
        channel: K,
        listener: (
            event: IpcRendererEvent,
            ...args: Parameters<PushEvents[K]>
        ) => void
    ): this;

    removeAllListeners<K extends keyof PushEvents>(channel?: K): this;

    send<K extends keyof CallEvents>(
        channel: K,
        ...args: Parameters<CallEvents[K]>
    ): void;

    sendSync<K extends keyof CallEvents>(
        channel: K,
        ...args: Parameters<CallEvents[K]>
    ): ReturnType<CallEvents[K]>;

    sendTo<K extends keyof CallEvents>(
        webContentsId: number,
        channel: K,
        ...args: Parameters<CallEvents[K]>
    ): void;

    sendToHost<K extends keyof CallEvents>(
        channel: K,
        ...args: Parameters<CallEvents[K]>
    ): void;

    invoke<K extends keyof Commands>(
        channel: K,
        ...args: Parameters<Commands[K]>
    ): Promise<ReturnType<Commands[K]>>;

    postMessage<K extends keyof MessageEvents>(
        channel: K,
        message: Parameters<MessageEvents[K]>[0],
        transfer?: MessagePort[]
    ): void;
}

export const ipcMain = ipcMainRaw as TypedIpcMain<IpcCallEvents & IpcMessageEvents, IpcCommands>;
