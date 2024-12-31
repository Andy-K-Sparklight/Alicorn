import { atob } from "js-base64";
import { uniqueHash } from "../commons/BasicHash";
import { safeGet } from "../commons/Null";
import { Account, authenticate, refreshToken, RemoteUserProfile, updateAccount, validateToken } from "./Account";
import { AccountType } from "./AccountUtil";
import { authAddrCorrect } from "./AJHelper";

// Account using Authlib Injector
export class AuthlibAccount extends Account {
    authServer: string;
    availableProfiles: RemoteUserProfile[] = [];
    selectedProfile: RemoteUserProfile | undefined;

    constructor(
        accountName: string,
        authServer: string,
        overrideType = AccountType.AUTHLIB_INJECTOR
    ) {
        super(accountName, overrideType);
        this.authServer = authServer;
    }

    // Only gather information, this function doesn't do any authentication!
    buildAccessData(): Promise<[string, string, string, string]> {
        return Promise.resolve([
            this.lastUsedUsername,
            this.lastUsedAccessToken,
            this.lastUsedUUID,
            "0"
        ]);
    }

    // Get a new token
    async flushToken(): Promise<boolean> {
        this.authServer = await authAddrCorrect(this.authServer);
        const p = await refreshToken(
            this.lastUsedAccessToken,
            this.authServer + "/authserver",
            this.selectedProfile
        );
        updateAccount(this, p);
        return p.success;
    }

    getAccountIdentifier(): string {
        return uniqueHash(this.accountName + this.authServer);
    }

    async isAccessTokenValid(): Promise<boolean> {
        this.authServer = await authAddrCorrect(this.authServer);
        return await validateToken(
            this.lastUsedAccessToken,
            this.authServer + "/authserver"
        );
    }

    async performAuth(password: string): Promise<boolean> {
        this.authServer = await authAddrCorrect(this.authServer);
        const st = await authenticate(
            this.accountName,
            password,
            this.authServer + "/authserver"
        );
        if (st.success) {
            updateAccount(this, st);
        }
        return st.success;
    }

    serialize(): string {
        return JSON.stringify({
            lastUsedUUID: this.lastUsedUUID,
            lastUsedAccessToken: this.lastUsedAccessToken,
            accountName: this.accountName,
            lastUsedUsername: this.lastUsedUsername,
            authServer: this.authServer
        });
    }
}

export async function getSkinByUUID(a: AuthlibAccount): Promise<string> {
    try {
        const o =
            a.authServer +
            `/sessionserver/session/minecraft/profile/${a.lastUsedUUID}`;
        const response = await (
            await fetch(o, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                cache: "no-cache",
                credentials: "include"
            })
        ).json();
        const props = safeGet(response, ["properties"]);
        if (!(props instanceof Array)) {
            return "";
        }
        if (props.length === 0) {
            return "";
        }
        let op = "";
        for (const c of props) {
            if (c.value && String(c.name).toLowerCase() === "textures") {
                op = String(c.value);
                break;
            }
        }
        if (op === "") {
            return "";
        }
        const bdecode = JSON.parse(atob(op));
        const target = safeGet(bdecode, ["textures", "SKIN", "url"], "");
        return String(target);
    } catch {
        return "";
    }
}
