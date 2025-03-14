import { AbstractException, coerceErrorMessage } from "@/main/except/exception";

export class UnknownException extends AbstractException<"unknown"> {
    #exs: string;

    constructor(ex: unknown) {
        const e = coerceErrorMessage(ex);
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

export class NoSuchElementException extends AbstractException<"no-such-element"> {
    #id: string;

    constructor(id: string) {
        super("no-such-element", { id });
        this.#id = id;
    }

    toString(): string {
        return `Element not found: ${this.#id}`;
    }
}
