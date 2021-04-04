import { Account } from "./Account";
import { Trio } from "../commons/Collections";
import { BrowserWindow } from "electron";
import got from "got";
import { isNull, safeGet } from "../commons/Null";

// The auth progress for MS accounts:
// User -> Code (Browser)
// Code -> MS Token
// MS Token -> Xbox Token & Xbox uhs
// Xbox Token -> XSTS Token
// XSTS uhs & XSTS Token -> MC Token (AuthData 2)
// MC Token -> MC uuid & MC Username (Auth Data 3 & AuthData 1)
// Rainboom!

const LOGIN_START =
  "https://login.live.com/oauth20_authorize.srf?client_id=00000000402b5328&response_type=code&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf";
let window: BrowserWindow | null = null;
const CODE_REGEX = /(?<=\?code=)[^&]+/gi;
const ERROR_REGEX = /(?<=\?error=)[^&]+/gi;
const ERROR_DESCRIPTION = /(?<=&error_description=)[^&]+/gi;
const XBL_URL = "https://user.auth.xboxlive.com/user/authenticate";
const XSTS_URL = "https://xsts.auth.xboxlive.com/xsts/authorize";
const MS_TOKEN_URL = "https://login.live.com/oauth20_token.srf";
const MJ_LOGIN_XBOX =
  "https://api.minecraftservices.com/authentication/login_with_xbox";
const MJ_PROFILE_API = "https://api.minecraftservices.com/minecraft/profile";

export class MicrosoftAccount extends Account {
  async buildAccessData(): Promise<Trio<string, string, string>> {
    return new Trio<string, string, string>(
      this.lastUsedUsername,
      this.lastUsedAccessToken,
      this.lastUsedUUID
    );
  }

  constructor(accountName: string) {
    super(accountName);
  }

  async flushToken(): Promise<boolean> {
    try {
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
      return true;
    } catch {
      return false;
    }
  }

  async isAccessTokenValid(): Promise<boolean> {
    try {
      await this.flushToken();
      return true;
    } catch {
      return false;
    }
  }

  async performAuth(password: string): Promise<boolean> {
    try {
      const code = await browserGetCode();
      const r = await getTokenByCode(code);
      if (!r.success) {
        return false;
      }
      this.refreshToken = String(r.refreshToken);
      return await this.flushToken();
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

// User -> Code
export async function browserGetCode(): Promise<string> {
  let sCode = "";
  console.log("Building login window...");
  window = new BrowserWindow({
    frame: false,
    width: 960,
    height: 540,
    show: false,
  });
  await window.loadURL(LOGIN_START);
  return new Promise<string>((resolve, reject) => {
    window?.on("close", () => {
      if (sCode === "") {
        console.log("Unexpected window closing, what have you done?");
        reject();
      }
    });
    window?.webContents.on("did-stop-loading", () => {
      const url = window?.webContents.getURL();
      if (url?.startsWith("https://login.live.com/oauth20_desktop.srf")) {
        if (CODE_REGEX.test(url)) {
          console.log("Code found. Closing login window.");
          sCode = unescape((url.match(CODE_REGEX) || [])[0] || "");
          window?.close();
          resolve(sCode);
          return;
        }
        if (ERROR_REGEX.test(url)) {
          sCode = "NOT FOUND";
          console.log(
            "Error during login: " +
              unescape((url.match(ERROR_REGEX) || [])[0] || "")
          );
          console.log(
            "Caused by: " +
              unescape((url.match(ERROR_DESCRIPTION) || [])[0] || "")
          );
        }
        console.log("Error occurred. Closing login window.");
        window?.close();
        reject();
      } else {
        console.log("Not a callback URL, showing window...");
        window?.show();
      }
    });
  });
}

interface AcquireTokenCallback {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
}

// Code -> MS Token
async function getTokenByCode(code: string): Promise<AcquireTokenCallback> {
  return tokenRequest(code);
}

// Refresh
async function refreshToken(
  refreshToken: string
): Promise<AcquireTokenCallback> {
  return tokenRequest(refreshToken, true);
}

async function tokenRequest(
  credit: string,
  isRefresh = false
): Promise<AcquireTokenCallback> {
  const grantType = isRefresh ? "refresh_token" : "authorization_code";
  const grantTag = isRefresh ? "refresh_token" : "code";
  try {
    const ret = (
      await got.post(MS_TOKEN_URL, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        responseType: "json",
        body: `client_id=00000000402b5328&${grantTag}=${credit}&grant_type=${grantType}&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL`,
      })
    ).body;
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
    return { success: true, accessToken, refreshToken };
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
    const response = (
      await got.post(XBL_URL, {
        responseType: "json",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
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
    ).body;
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
    const response = (
      await got.post(XSTS_URL, {
        responseType: "json",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          Properties: {
            SandboxId: "RETAIL",
            UserTokens: [xblToken],
          },
          RelyingParty: "rp://api.minecraftservices.com/",
          TokenType: "JWT",
        }),
      })
    ).body;
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
    const response = (
      await got.post(MJ_LOGIN_XBOX, {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identityToken: `XBL3.0 x=${uhs};${xstsToken}`,
        }),
        responseType: "json",
      })
    ).body;
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
    const response = (
      await got.get(MJ_PROFILE_API, {
        responseType: "json",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${acToken}`,
        },
      })
    ).body;
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
