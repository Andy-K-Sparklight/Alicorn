import type { TemporalAccountProps } from "@/main/auth/temp";
import type { VanillaAccountProps } from "@/main/auth/vanilla";
import type { YggdrasilAccountProps } from "@/main/auth/yggdrasil";
import { AbstractException } from "@/main/except/exception";
import type { RegistryTransformer } from "@/main/registry/registry";

export interface AuthCredentials {
    accessToken: string;
    uuid: string;
    xboxId: string;
    playerName: string;
    userType: string;
}

export interface Account {
    uuid: string;

    /**
     * Refresh the account.
     */
    refresh(): Promise<void>;

    /**
     * Export credentials.
     */
    credentials(): AuthCredentials;

    /**
     * Create props for serialization.
     */
    toProps(): AccountProps;
}

export type AccountProps = TemporalAccountProps | VanillaAccountProps | YggdrasilAccountProps;

export type DetailedAccountProps = AccountProps & { uuid: string; }

export class AuthFailedException extends AbstractException<"auth-failed"> {
    #cause?: unknown;

    constructor(cause?: unknown) {
        super("auth-failed", {}, cause);
        this.#cause = cause;
    }

    toString(): string {
        return `Authentication failed: ${this.#cause}`;
    }
}

export const ACCOUNT_REG_VERSION = 0;
export const ACCOUNT_REG_TRANS: RegistryTransformer[] = [];
