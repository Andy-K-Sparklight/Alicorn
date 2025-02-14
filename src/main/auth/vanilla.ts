import { Account, type AccountProps, AuthCredentials } from "@/main/auth/types";
import { vanillaOAuth } from "@/main/auth/vanilla-oauth";
import { doDecrypt, doEncrypt } from "@/main/security/encrypt";
import { net } from "electron";
import { nanoid } from "nanoid";

const OAUTH_API = "https://login.live.com/oauth20_token.srf";
const XBL_API = "https://user.auth.xboxlive.com/user/authenticate";
const XSTS_API = "https://xsts.auth.xboxlive.com/xsts/authorize";
const MOJANG_LOGIN_API = "https://api.minecraftservices.com/authentication/login_with_xbox";
const MOJANG_PROFILE_API = "https://api.minecraftservices.com/minecraft/profile";

export class VanillaAccount implements Account {
    uuid = "";

    #partId: string;
    #refreshToken = "";
    #playerName = "";
    #accessToken = "";
    #refreshTokenExpiresAt = -1;
    #accessTokenExpiresAt = -1;
    #oAuthToken = "";
    #xblToken = "";
    #xstsToken = "";
    #xboxId = "";
    #userHash = "";
    #code = "";

    static fromProps(props: VanillaAccountProps): VanillaAccount {
        const a = new VanillaAccount(props.partitionId);
        a.uuid = props.uuid;
        a.#playerName = props.playerName;
        a.#accessToken = props.accessToken;
        a.#refreshToken = props.refreshToken;

        if (props.encrypted) {
            a.#accessToken = doDecrypt(a.#accessToken);
            a.#refreshToken = doDecrypt(a.#refreshToken);
        }

        a.#accessTokenExpiresAt = props.accessTokenExpirationTime;
        a.#refreshTokenExpiresAt = props.refreshTokenExpirationTime;
        return a;
    }

    constructor(partId?: string) {
        this.#partId = partId || nanoid();
    }

    credentials(): AuthCredentials {
        return {
            uuid: this.uuid,
            playerName: this.#playerName,
            xboxId: this.#xboxId,
            accessToken: this.#accessToken
        };
    }

    async refresh(): Promise<boolean> {
        if (!this.#isAccessTokenExpired()) {
            console.log(`Account ${this.uuid} is not expired, skipped.`);
            return true;
        }

        try {
            if (this.#isOAuthTokenExpired()) {
                console.log("Obtaining new OAuth code.");
                await this.#getCode();
            } else {
                console.log("Reusing existing refresh token.");
            }

            await this.#getOAuthToken(!this.#isOAuthTokenExpired());
            await this.#getXBLToken();
            await Promise.all([
                this.#getXboxId(),
                (async () => {
                    await this.#getXSTSToken();
                    await this.#getAccessToken();
                    await this.#getUserProfile();
                })()
            ]);

            console.log(`Login complete. Welcome back, ${this.#playerName}!`);
            return true;
        } catch (e) {
            console.error(`Login failed: ${e}`);
            return false;
        }
    }

    toProps(): AccountProps {
        return {
            type: "vanilla",
            encrypted: true,
            uuid: this.uuid,
            partitionId: this.#partId,
            playerName: this.#playerName,
            accessToken: doEncrypt(this.#accessToken),
            refreshToken: doEncrypt(this.#refreshToken),
            accessTokenExpirationTime: this.#accessTokenExpiresAt,
            refreshTokenExpirationTime: this.#refreshTokenExpiresAt
        };
    }

    #isOAuthTokenExpired(): boolean {
        return this.#refreshTokenExpiresAt <= Date.now();
    }

    #isAccessTokenExpired(): boolean {
        return this.#accessTokenExpiresAt <= Date.now();
    }

    async #getCode(): Promise<void> {
        this.#code = await vanillaOAuth.browserLogin(this.#partId);
        if (!this.#code) throw "Empty code received (the login may have failed)";
    }

    async #getOAuthToken(refresh: boolean) {
        console.log("Code -> OAuth Token");
        const doRefresh = refresh && this.#refreshToken;

        const credit = doRefresh ? this.#refreshToken : this.#code;
        const grantType = doRefresh ? "refresh_token" : "authorization_code";
        const grantTag = doRefresh ? "refresh_token" : "code";

        const res = await net.fetch(OAUTH_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: "00000000402b5328",
                [grantTag]: credit,
                grant_type: grantType,
                redirect_uri: "https://login.live.com/oauth20_desktop.srf",
                scope: "service::user.auth.xboxlive.com::MBI_SSL"
            })
        });

        const dat = await res.json();

        if (dat.error) throw `OAuth token authorization failed: ${dat.error}`;

        const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = dat;

        if (!accessToken) throw `Empty OAuth token received (the authorization may have failed)`;

        this.#refreshTokenExpiresAt = Date.now() + (expiresIn - 300) * 1000; // Reserve 5min for the token
        this.#oAuthToken = accessToken;
        this.#refreshToken = refreshToken ?? "";
    }

    async #getXBLToken(): Promise<void> {
        console.log("OAuth Token -> XBL");
        const res = await net.fetch(XBL_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                Properties: {
                    AuthMethod: "RPS",
                    SiteName: "user.auth.xboxlive.com",
                    RpsTicket: this.#oAuthToken
                },
                RelyingParty: "http://auth.xboxlive.com",
                TokenType: "JWT"
            })
        });

        const dat = await res.json();

        if (dat.error) throw `XBL token authorization failed: ${dat.error}`;

        const { Token: token, DisplayClaims: { xui: [{ uhs }] } } = dat;

        if (!token || !uhs) throw `Empty XBL token received (the authorization may have failed)`;

        this.#xblToken = token;
        this.#userHash = uhs;
    }

    async #getXboxId(): Promise<void> {
        console.log("XBL -> Xbox ID");
        const res = await net.fetch(XSTS_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                Properties: {
                    SandboxId: "RETAIL",
                    UserTokens: [this.#xblToken]
                },
                RelyingParty: "http://xboxlive.com",
                TokenType: "JWT"
            })
        });

        const dat = await res.json();

        if (dat.error) throw `XSTS token authorization failed: ${dat.error}`;

        const { DisplayClaims: { xui: [{ xid }] } } = dat;

        this.#xboxId = xid ?? ""; // Xbox ID is not enforced
    }

    async #getXSTSToken(): Promise<void> {
        console.log("XBL -> XSTS");
        const res = await net.fetch(XSTS_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                Properties: {
                    SandboxId: "RETAIL",
                    UserTokens: [this.#xblToken]
                },
                RelyingParty: "rp://api.minecraftservices.com/",
                TokenType: "JWT"
            })
        });

        const dat = await res.json();

        if (dat.error) throw `XSTS token authorization failed: ${dat.error}`;

        const { Token: token } = dat;

        if (!token) throw `Empty XSTS token received (the authorization may have failed)`;

        this.#xstsToken = token;
    }

    async #getAccessToken(): Promise<void> {
        console.log("XSTS -> Access Token");
        const res = await net.fetch(MOJANG_LOGIN_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identityToken: `XBL3.0 x=${this.#userHash};${this.#xstsToken}`
            })
        });

        const { access_token: accessToken, expires_in: expiresIn } = await res.json();

        if (!accessToken) throw "Empty access token received (the authorization may have failed)";

        this.#accessTokenExpiresAt = Date.now() + (expiresIn - 300) * 1000;
        this.#accessToken = accessToken;
    }


    async #getUserProfile(): Promise<void> {
        console.log("Access Token -> Profile");
        const res = await net.fetch(MOJANG_PROFILE_API, {
            headers: {
                Authorization: `Bearer ${this.#accessToken}`
            }
        });

        const { id, name } = await res.json();

        if (!id || !name) throw "Empty profile received (the authorization may have failed)";

        this.uuid = id;
        this.#playerName = name;
    }
}

export interface VanillaAccountProps {
    type: "vanilla";
    encrypted?: boolean;
    uuid: string;
    partitionId: string;
    playerName: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpirationTime: number;
    refreshTokenExpirationTime: number;
}
