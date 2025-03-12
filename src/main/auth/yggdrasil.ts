import type { Account, AccountProps, AuthCredentials } from "@/main/auth/types";
import { doDecrypt, doEncrypt } from "@/main/security/encrypt";
import { exceptions } from "@/main/util/exception";
import { net } from "electron";

export interface YggdrasilAccountProps {
    type: "yggdrasil";
    host: string;
    email: string;
    uuid: string;
    playerName: string;
    accessToken: string;
}

interface YggdrasilResponse {
    accessToken: string;
    selectedProfile?: {
        id: string;
        name: string;
    };
}

export class YggdrasilAccount implements Account {
    uuid = "";
    host: string;
    email: string;
    #playerName = "";
    #accessToken = "";

    static fromProps(props: YggdrasilAccountProps): Account {
        const a = new YggdrasilAccount(props.host, props.email);
        a.uuid = props.uuid;
        a.#playerName = props.playerName;
        a.#accessToken = doDecrypt(props.accessToken);
        return a;
    }

    constructor(host: string, email: string) {
        this.host = host;
        this.email = email;
    }

    async refresh(): Promise<void> {
        if (await this.#validate()) return;
        await this.#refresh();
    }

    async login(pwd: string) {
        await this.#locateHost();

        const res = await this.#apiRequest("/authserver/authenticate",
            {
                username: this.email,
                password: pwd,
                requestUser: false,
                agent: {
                    name: "Minecraft",
                    version: 1
                }
            }
        );

        if (!res.ok) throw exceptions.create("auth", {});

        const rp = await res.json() as YggdrasilResponse;

        // TODO support multiple characters
        if (!rp.selectedProfile) throw exceptions.create("auth", {});

        this.#updateCredentials(rp);

        console.debug(`Login complete. Welcome back, ${this.#playerName}!`);
    }

    async #locateHost() {
        this.host = await processALI(this.host);
        if (this.host.endsWith("/")) {
            this.host = this.host.slice(0, -1);
        }
        console.debug(`Identified API address: ${this.host}`);
    }

    async #refresh() {
        const res = await this.#apiRequest("/authserver/refresh",
            {
                accessToken: this.#accessToken
            }
        );

        if (!res.ok) throw exceptions.create("auth", {});

        const rp = await res.json() as YggdrasilResponse;
        this.#updateCredentials(rp);
    }

    #updateCredentials(rp: YggdrasilResponse) {
        if (!rp.selectedProfile) throw exceptions.create("auth", {});

        this.#accessToken = rp.accessToken;
        this.uuid = rp.selectedProfile.id;
        this.#playerName = rp.selectedProfile.name;
    }

    async #validate(): Promise<boolean> {
        if (!this.#accessToken) return false;
        try {
            const res = await this.#apiRequest("/authserver/validate",
                {
                    accessToken: this.#accessToken
                }
            );

            return res.status === 204;
        } catch {
            return false;
        }
    }

    #apiRequest(endpoint: string, body: any) {
        return net.fetch(this.host + endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(body)
        });
    }

    credentials(): AuthCredentials {
        return {
            uuid: this.uuid,
            playerName: this.#playerName,
            accessToken: this.#accessToken,
            xboxId: "0"
        };
    }

    toProps(): AccountProps {
        return {
            type: "yggdrasil",
            host: this.host,
            email: this.email,
            uuid: this.uuid,
            playerName: this.#playerName,
            accessToken: doEncrypt(this.#accessToken)
        };
    }
}

async function processALI(url: string): Promise<string> {
    if (!url.includes("://")) {
        url = "https://" + url;
    }

    // A HEAD request should satisfy the headers, yet it's not enforced in the documentation
    // We'll stick to GET anyway
    try {
        const res = await net.fetch(url);
        const pt = res.headers.get("X-Authlib-Injector-API-Location");
        if (pt) {
            try {
                return new URL(pt, url).toString();
            } catch {}
        }
    } catch (e) {
        console.warn(`Unable to query ALI header from ${url}`);
        console.warn(e);
    }

    return url;
}
