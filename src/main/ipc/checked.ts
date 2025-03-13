import { AbstractException, UnknownException } from "@/main/except/exception";
import type { GameProfile } from "@/main/game/spec";
import { ipcMain } from "electron";

const handlers = new Map<string, Function>();

export interface CheckedIpcCommands {
    getGameProfile(id: string): GameProfile;
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
        if (!(e instanceof AbstractException)) {
            e = new UnknownException(e);
        }

        return {
            success: false,
            error: (e as AbstractException<any>).toJSON()
        };
    }
});

export function addCheckedHandler<K extends keyof CheckedIpcCommands>(
    method: K,
    handler: (...args: Parameters<CheckedIpcCommands[K]>) => OptionalPromise<ReturnType<CheckedIpcCommands[K]>>
) {
    handlers.set(method, handler);
}
