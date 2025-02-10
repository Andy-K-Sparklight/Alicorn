import type { LocalAccountProps } from "@/main/auth/local";
import type { VanillaAccountProps } from "@/main/auth/vanilla";
import type { RegistryTransformer } from "@/main/registry/registry";

export interface AuthCredentials {
    accessToken: string;
    uuid: string;
    xboxId: string;
    playerName: string;
}

export interface Account {
    uuid: string;

    /**
     * Refresh the account.
     */
    refresh(): Promise<boolean>;

    /**
     * Export credentials.
     */
    credentials(): AuthCredentials;

    /**
     * Create props for serialization.
     */
    toProps(): AccountProps;
}

export type AccountProps = LocalAccountProps | VanillaAccountProps;

export const ACCOUNT_REG_VERSION = 0;
export const ACCOUNT_REG_TRANS: RegistryTransformer[] = [];
