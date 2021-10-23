import { ipcRenderer } from "electron";
import { Trio } from "../commons/Collections";
import { isNull, safeGet } from "../commons/Null";
import { getString } from "../config/ConfigSupport";
import { decrypt2, encrypt2 } from "../security/Encrypt";
import { Account } from "./Account";
import { AccountType } from "./AccountUtil";

// The auth progress for MS accounts:
// User -> Code (Browser)
// Code -> MS Token
// MS Token -> Xbox Token & Xbox uhs
// Xbox Token -> XSTS Token
// Xbox uhs & XSTS Token -> MC Token (AuthData 2)
// MC Token -> MC uuid & MC Username (Auth Data 3 & AuthData 1)
// Rainboom!

const XBL_URL = "https://user.auth.xboxlive.com/user/authenticate";
const XSTS_URL = "https://xsts.auth.xboxlive.com/xsts/authorize";
const MS_TOKEN_URL = "https://login.live.com/oauth20_token.srf";
const MJ_LOGIN_XBOX =
  "https://api.minecraftservices.com/authentication/login_with_xbox";
const MJ_PROFILE_API = "https://api.minecraftservices.com/minecraft/profile";

export const MS_LAST_USED_USERNAME_KEY = "MS.LastUsedUserName";
export const MS_LAST_USED_ACTOKEN_KEY = "MS.LastUsedACToken"; // Encrypt
export const MS_LAST_USED_UUID_KEY = "MS.LastUsedUUID";
export const MS_LAST_USED_REFRESH_KEY = "MS.LastUsedRefresh"; // Encrypt

export class MicrosoftAccount extends Account {
  buildAccessData(): Promise<Trio<string, string, string>> {
    return Promise.resolve(
      new Trio<string, string, string>(
        this.lastUsedUsername,
        this.lastUsedAccessToken,
        this.lastUsedUUID
      )
    );
  }

  constructor(accountName: string) {
    super(accountName, AccountType.MICROSOFT);
    this.lastUsedUsername =
      localStorage.getItem(MS_LAST_USED_USERNAME_KEY) || "";
    this.lastUsedUUID = localStorage.getItem(MS_LAST_USED_UUID_KEY) || "";
    this.lastUsedAccessToken = decrypt2(
      localStorage.getItem(MS_LAST_USED_ACTOKEN_KEY) || ""
    );
    this.refreshToken = decrypt2(
      localStorage.getItem(MS_LAST_USED_REFRESH_KEY) || ""
    );
  }

  async flushToken(): Promise<boolean> {
    try {
      if (isNull(this.refreshToken)) {
        return false;
      }
      const r1 = await refreshToken(this.refreshToken);
      if (!r1.success) {
        return false;
      }
      this.refreshToken = r1.refreshToken || this.refreshToken;
      const m1 = r1.accessToken;
      const r2 = await getXBLToken(String(m1));
      if (!r2.success) {
        return false;
      }
      const m2 = r2.token;
      const u = r2.uhs;
      const r3 = await getXSTSToken(String(m2));
      if (!r3.success) {
        return false;
      }
      const m3 = r3.token;
      const r4 = await getMojangToken(String(u), String(m3));
      if (isNull(r4)) {
        return false;
      }
      this.lastUsedAccessToken = r4;
      const r5 = await getUUIDAndUserName(r4);
      if (!r5.success) {
        return false;
      }
      this.lastUsedUsername = String(r5.name);
      this.lastUsedUUID = String(r5.uuid);
      saveUUID(this.lastUsedUUID);
      saveUserName(this.lastUsedUsername);
      saveRefreshToken(this.refreshToken);
      saveAccessToken(this.lastUsedAccessToken);
      return true;
    } catch {
      return false;
    }
  }

  async isAccessTokenValid(): Promise<boolean> {
    try {
      if (isNull(this.lastUsedAccessToken)) {
        return false;
      }
      return (await getUUIDAndUserName(this.lastUsedAccessToken)).success;
    } catch {
      return false;
    }
  }

  async performAuth(password: string): Promise<boolean> {
    try {
      const code = await browserGetCode();
      if (code.trim().length === 0) {
        return false;
      }
      const r = await getTokenByCode(code);
      if (!r.success) {
        return false;
      }
      this.refreshToken = String(r.refreshToken);
      if (!(await this.flushToken())) {
        return await this.flushToken();
      }
      saveUUID(this.lastUsedUUID);
      saveUserName(this.lastUsedUsername);
      saveRefreshToken(this.refreshToken);
      saveAccessToken(this.lastUsedAccessToken);
      return true;
    } catch {
      return false;
    }
  }

  serialize(): string {
    return JSON.stringify({
      lastUsedUUID: this.lastUsedUUID,
      lastUsedAccessToken: this.lastUsedAccessToken,
      accountName: this.accountName,
      lastUsedUsername: this.lastUsedUsername,
      refreshToken: this.refreshToken,
    });
  }

  refreshToken = "";
}

function saveRefreshToken(v: string): void {
  localStorage.setItem(MS_LAST_USED_REFRESH_KEY, encrypt2(v));
}

function saveUUID(v: string): void {
  localStorage.setItem(MS_LAST_USED_UUID_KEY, v);
}

function saveUserName(v: string): void {
  localStorage.setItem(MS_LAST_USED_USERNAME_KEY, v);
}

function saveAccessToken(v: string): void {
  localStorage.setItem(MS_LAST_USED_ACTOKEN_KEY, encrypt2(v));
}

// User -> Code
// Only in remote!
export async function browserGetCode(): Promise<string> {
  console.log("Building login window...");
  return await ipcRenderer.invoke(
    "msBrowserCode",
    getString("web.global-proxy")
  );
}

interface AcquireTokenCallback {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
}

// Code -> MS Token
async function getTokenByCode(code: string): Promise<AcquireTokenCallback> {
  return await tokenRequest(code);
}

// Refresh
async function refreshToken(
  refreshToken: string
): Promise<AcquireTokenCallback> {
  return await tokenRequest(refreshToken, true);
}

async function tokenRequest(
  credit: string,
  isRefresh = false
): Promise<AcquireTokenCallback> {
  const grantType = isRefresh ? "refresh_token" : "authorization_code";
  const grantTag = isRefresh ? "refresh_token" : "code";
  try {
    const ret = await (
      await fetch(MS_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        cache: "no-cache",
        body: `client_id=00000000402b5328&${grantTag}=${credit}&grant_type=${grantType}&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL`,
      })
    ).json();
    if (!isNull(safeGet(ret, ["error"]))) {
      return {
        success: false,
      };
    }
    const accessToken = String(safeGet(ret, ["access_token"], ""));
    const refreshToken = String(safeGet(ret, ["refresh_token"], ""));
    if (isNull(accessToken) || isNull(refreshToken)) {
      return { success: false };
    }
    return {
      success: true,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  } catch {
    return {
      success: false,
    };
  }
}

interface AcquireXBLXSTSTokenCallback {
  success: boolean;
  token?: string;
  uhs?: string;
}

// MS Token -> Xbox Token
async function getXBLToken(
  msToken: string
): Promise<AcquireXBLXSTSTokenCallback> {
  try {
    const response = await (
      await fetch(XBL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-cache",
        body: JSON.stringify({
          Properties: {
            AuthMethod: "RPS",
            SiteName: "user.auth.xboxlive.com",
            RpsTicket: msToken,
          },
          RelyingParty: "http://auth.xboxlive.com",
          TokenType: "JWT",
        }),
      })
    ).json();
    const token = safeGet(response, ["Token"]);
    const uhs = safeGet(response, ["DisplayClaims", "xui", 0, "uhs"]);
    if (isNull(token) || isNull(uhs)) {
      return { success: false };
    }
    return {
      success: true,
      token: String(token),
      uhs: String(uhs),
    };
  } catch {
    return { success: false };
  }
}

// Xbox Token -> XSTS Token
async function getXSTSToken(
  xblToken: string
): Promise<AcquireXBLXSTSTokenCallback> {
  try {
    const response = await (
      await fetch(XSTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-cache",
        body: JSON.stringify({
          Properties: {
            SandboxId: "RETAIL",
            UserTokens: [xblToken],
          },
          RelyingParty: "rp://api.minecraftservices.com/",
          TokenType: "JWT",
        }),
      })
    ).json();
    const token = safeGet(response, ["Token"]);
    if (isNull(token)) {
      return { success: false };
    }
    return {
      success: true,
      token: String(token),
      uhs: undefined,
    };
  } catch {
    return { success: false };
  }
}

// Xbox uhs & XSTS Token -> MC Token
async function getMojangToken(uhs: string, xstsToken: string): Promise<string> {
  try {
    const response = await (
      await fetch(MJ_LOGIN_XBOX, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
        body: JSON.stringify({
          identityToken: `XBL3.0 x=${uhs};${xstsToken}`,
        }),
      })
    ).json();
    return String(safeGet(response, ["access_token"], ""));
  } catch {
    return "";
  }
}

interface MinecraftUserProfileCallback {
  success: boolean;
  name?: string;
  uuid?: string;
}

// MC Token -> MC uuid & MC Username
async function getUUIDAndUserName(
  acToken: string
): Promise<MinecraftUserProfileCallback> {
  try {
    const response = await (
      await fetch(MJ_PROFILE_API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${acToken}`,
        },
        cache: "no-cache",
      })
    ).json();
    const uuid = safeGet(response, ["id"]);
    const name = safeGet(response, ["name"]);
    if (isNull(uuid) || isNull(name)) {
      return { success: false };
    }
    return {
      success: true,
      uuid: String(uuid),
      name: String(name),
    };
  } catch {
    return { success: false };
  }
}
