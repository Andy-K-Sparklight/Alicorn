import { Account, AuthCredentials } from "@/main/auth/spec";
import crypto from "node:crypto";

export class LocalAccount implements Account {
    uuid: string;
    private readonly name: string;

    constructor(name: string) {
        this.name = name;
        this.uuid = offlineUUIDOf(name);
    }

    credentials(): AuthCredentials {
        if (import.meta.env.AL_ENABLE_LOCAL_ACCOUNT) {
            return {
                playerName: this.name,
                uuid: this.uuid,
                accessToken: "0",
                xboxId: "0"
            };
        }

        throw "Local account is not enabled in this build";
    }

    async refresh(): Promise<boolean> {
        return true;
    }
}

function offlineUUIDOf(name: string): string {
    const bytes = crypto.createHash("md5").update(`OfflinePlayer:${name}`).digest();
    bytes[6] &= 0x0f;
    bytes[6] |= 0x30;
    bytes[8] &= 0x3f;
    bytes[8] |= 0x80;
    return bytes.toString("hex");
}
