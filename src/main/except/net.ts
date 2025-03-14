import { AbstractException } from "@/main/except/exception";

export class NetRequestFailedException extends AbstractException<"net-request-failed"> {
    #url: string;
    #code?: number;

    constructor(url: string, code?: number) {
        super("net-request-failed", { url, code });
        this.#url = url;
        this.#code = code;
    }

    toString(): string {
        return `Request failed for ${this.#url}: ${this.#code}`;
    }
}
