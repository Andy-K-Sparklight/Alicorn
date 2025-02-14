import { Account, type AccountProps, AuthCredentials } from "@/main/auth/types";
import crypto from "node:crypto";

/**
 * Provided to the user as an alternative authenticate method when failed to log-in.
 *
 * We can assume that the user owns a valid premium account as it's already checked during setup.
 * Therefore, this class simply emulates the behavior from the vanilla launcher (so-called "offline mode").
 */
export class TemporalAccount implements Account {
    uuid;
    #name: string;

    static fromProps(props: TemporalAccountProps): TemporalAccount {
        return new TemporalAccount(props.playerName);
    }

    constructor(name: string) {
        this.#name = name;
        this.uuid = offlineUUIDOf(name);
    }

    credentials(): AuthCredentials {
        return {
            playerName: this.#name,
            uuid: this.uuid,
            accessToken: "0",
            xboxId: "0"
        };
    }

    async refresh(): Promise<boolean> {
        return true;
    }

    toProps(): AccountProps {
        return {
            type: "local",
            playerName: this.#name
        };
    }
}

/**
 * Calculates a Spigot-compatible UUID of an offline player with the given name.
 */
function offlineUUIDOf(name: string): string {
    const bytes = crypto.createHash("md5").update(`OfflinePlayer:${name}`).digest();
    bytes[6] &= 0x0f;
    bytes[6] |= 0x30;
    bytes[8] &= 0x3f;
    bytes[8] |= 0x80;
    return bytes.toString("hex").toLowerCase();
}

export interface TemporalAccountProps {
    type: "local";
    playerName: string;
}
