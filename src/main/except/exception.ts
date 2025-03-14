import { UnknownException } from "@/main/except/common";

interface CatchyExceptionType {
    unknown: { err: string };
    cancelled: {};
    "no-handler-registered": { method: string };
    "no-such-element": { id: string };
    "net-request-failed": { url: string, code?: number };
    "net-mirrors-all-failed": { url: string };
    "launch-spawn-failed": { err: string };
    "download-failed": { url: string };
    "profile-link-failed": { id: string };
    "auth-failed": { err: string };
    "unavailable-mod-loader": { version: string };
    "optifine-install-failed": { code: number };
    "jrt-install-failed": { component: string };
    "forge-install-failed": {};
}

export type SerializedException<K extends keyof CatchyExceptionType = keyof CatchyExceptionType> = {
    _ALICORN_CHECKED_EXCEPTION: true;
    name: K;
    props: CatchyExceptionType[K];
    stack?: string;
    cause?: SerializedException;
}

interface SerializableException<K extends keyof CatchyExceptionType = keyof CatchyExceptionType> {
    serialize(): SerializedException<K>;

    toJSON(): string;

    toString(): string;
}

function getStack() {
    const ex = new Error().stack?.split("\n");
    if (!ex) return "";
    return ex.slice(3).join("\n"); // Drop caller stack and skip `AbstractException` for a shorter stacktrace
}

export class AbstractException<K extends keyof CatchyExceptionType = keyof CatchyExceptionType> implements SerializableException<K> {
    #except: SerializedException<K>;

    constructor(name: K, props: CatchyExceptionType[K], cause?: unknown) {
        const ex = cause === undefined ? undefined : (cause instanceof AbstractException ? cause : new UnknownException(cause));
        this.#except = {
            _ALICORN_CHECKED_EXCEPTION: true,
            name,
            props,
            cause: ex?.serialize(),
            stack: getStack()
        };
    }

    serialize(): SerializedException<K> {
        return this.#except;
    }

    toJSON(): string {
        return JSON.stringify(this.serialize());
    }

    toString(): string {
        return "Abstract (uninitialized) exception. This method should be overridden to suppress this message.";
    }
}

export function coerceErrorMessage(ex: unknown) {
    if (typeof ex === "object" && ex !== null) {
        if ("message" in ex && typeof ex.message === "string") return ex.message;
    }

    if (typeof ex === "string") return ex;

    return String(ex);
}
