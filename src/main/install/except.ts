import { AbstractException } from "@/main/except/exception";

export class UnavailableModLoaderException extends AbstractException<"unavailable-mod-loader"> {
    #version: string;

    constructor(version: string) {
        super("unavailable-mod-loader", { version });
        this.#version = version;
    }

    toString(): string {
        return `No mod loader available for game version ${this.#version}`;
    }
}
