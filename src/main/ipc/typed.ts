import {
    type IpcMain,
    type IpcMainEvent,
    type IpcMainInvokeEvent,
    type IpcRenderer,
    type IpcRendererEvent,
    ipcMain as ipcMainRaw,
} from "electron";
import type { IpcCallEvents, IpcCommands, IpcMessageEvents } from "@/main/ipc/channels";

type OptionalPromise<T> = T | Promise<T>;
interface InputMap {
    [key: string]: (...args: any) => any;
}

export interface TypedIpcMain<
    IpcEvents extends Record<keyof IpcEvents, InputMap[string]>,
    IpcCommands extends Record<keyof IpcCommands, InputMap[string]>,
> extends IpcMain {
    on<K extends keyof IpcEvents & string>(
        channel: K,
        listener: (event: IpcMainEvent, ...args: Parameters<IpcEvents[K]>) => void,
    ): this;

    once<K extends keyof IpcEvents & string>(
        channel: K,
        listener: (event: IpcMainEvent, ...args: Parameters<IpcEvents[K]>) => void,
    ): this;

    removeListener<K extends keyof IpcEvents & string>(
        channel: K,
        listener: (event: IpcMainEvent, ...args: Parameters<IpcEvents[K]>) => void,
    ): this;

    removeAllListeners<K extends keyof IpcEvents & string>(channel?: K): this;

    handle<K extends keyof IpcCommands & string>(
        channel: K,
        listener: (
            event: IpcMainInvokeEvent,
            ...args: Parameters<IpcCommands[K]>
        ) => OptionalPromise<ReturnType<IpcCommands[K]>>,
    ): void;

    handleOnce<K extends keyof IpcCommands & string>(
        channel: K,
        listener: (
            event: IpcMainInvokeEvent,
            ...args: Parameters<IpcCommands[K]>
        ) => OptionalPromise<ReturnType<IpcCommands[K]>>,
    ): void;

    removeHandler<K extends keyof IpcCommands & string>(channel: K): void;
}

export interface TypedIpcRenderer<
    CallEvents extends Record<keyof CallEvents, InputMap[string]>,
    PushEvents extends Record<keyof PushEvents, InputMap[string]>,
    MessageEvents extends Record<keyof MessageEvents, InputMap[string]>,
    Commands extends Record<keyof Commands, InputMap[string]>,
> extends IpcRenderer {
    on<K extends keyof PushEvents & string>(
        channel: K,
        listener: (event: IpcRendererEvent, ...args: Parameters<PushEvents[K]>) => void,
    ): this;

    once<K extends keyof PushEvents & string>(
        channel: K,
        listener: (event: IpcRendererEvent, ...args: Parameters<PushEvents[K]>) => void,
    ): this;

    removeListener<K extends keyof PushEvents & string>(
        channel: K,
        listener: (event: IpcRendererEvent, ...args: Parameters<PushEvents[K]>) => void,
    ): this;

    removeAllListeners<K extends keyof PushEvents & string>(channel?: K): this;

    send<K extends keyof CallEvents & string>(channel: K, ...args: Parameters<CallEvents[K]>): void;

    sendSync<K extends keyof CallEvents & string>(
        channel: K,
        ...args: Parameters<CallEvents[K]>
    ): ReturnType<CallEvents[K]>;

    sendTo<K extends keyof CallEvents & string>(
        webContentsId: number,
        channel: K,
        ...args: Parameters<CallEvents[K]>
    ): void;

    sendToHost<K extends keyof CallEvents & string>(
        channel: K,
        ...args: Parameters<CallEvents[K]>
    ): void;

    invoke<K extends keyof Commands & string>(
        channel: K,
        ...args: Parameters<Commands[K]>
    ): Promise<ReturnType<Commands[K]>>;

    postMessage<K extends keyof MessageEvents & string>(
        channel: K,
        message: Parameters<MessageEvents[K]>[0],
        transfer?: MessagePort[],
    ): void;
}

export const ipcMain = ipcMainRaw as TypedIpcMain<IpcCallEvents & IpcMessageEvents, IpcCommands>;
