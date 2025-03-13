interface CatchyExceptionType {
    unknown: { err: string };
    cancelled: {};
    "no-handler-registered": { method: string };
    "no-such-element": { id: string };
}

export type SerializedException<K extends keyof CatchyExceptionType> = {
    _ALICORN_CHECKED_EXCEPTION: true;
    name: K;
    props: CatchyExceptionType[K];
    cause?: SerializedException<any>;
}

interface SerializableException<K extends keyof CatchyExceptionType> {
    serialize(): SerializedException<K>;

    toJSON(): string;

    toString(): string;
}

export class AbstractException<K extends keyof CatchyExceptionType> implements SerializableException<K> {
    #except: SerializedException<K>;

    constructor(name: K, props: CatchyExceptionType[K], cause?: SerializableException<any>) {
        this.#except = { _ALICORN_CHECKED_EXCEPTION: true, name, props, cause: cause?.serialize() };
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

export class UnknownException extends AbstractException<"unknown"> {
    #exs: string;

    constructor(ex: unknown) {
        const e = String(ex);
        super("unknown", { err: e });
        this.#exs = e;
    }

    toString(): string {
        return this.#exs;
    }
}

export class CancelledException extends AbstractException<"cancelled"> {
    constructor() {
        super("cancelled", {});
    }

    toString(): string {
        return "Operation cancelled";
    }
}
