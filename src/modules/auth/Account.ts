import { uniqueHash } from "../commons/BasicHash";
import { Trio } from "../commons/Collections";
import { isNull, safeGet } from "../commons/Null";
import { getUniqueID32 } from "../security/Encrypt";
import { AccountType } from "./AccountUtil";
import { AuthlibAccount } from "./AuthlibAccount";
import { MojangAccount } from "./MojangAccount";

export abstract class Account {
  type: AccountType;

  protected constructor(accountName: string, accountType: AccountType) {
    this.lastUsedUsername = "";
    this.accountName = accountName;
    this.lastUsedUUID = "";
    this.lastUsedAccessToken = "";
    this.type = accountType;
  }

  abstract performAuth(password: string): Promise<boolean>;

  abstract isAccessTokenValid(): Promise<boolean>;

  abstract flushToken(): Promise<boolean>;

  abstract buildAccessData(): Promise<Trio<string, string, string>>;

  // AccessData(or AuthData) is a Trio
  // Username, AccessToken, UUID

  getAccountIdentifier(): string {
    return uniqueHash(this.accountName);
  }

  abstract serialize(): string;

  lastUsedUsername: string;
  lastUsedUUID: string;
  lastUsedAccessToken: string;
  accountName: string;
}

export async function refreshToken(
  acToken: string,
  authServer: string,
  selectedProfile?: RemoteUserProfile
): Promise<AuthenticateDataCallback> {
  try {
    const rtt = (
      await fetch(trimURL(authServer) + "/refresh", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        cache: "no-cache",
        body: JSON.stringify({
          accessToken: acToken,
        }),
      })
    ).body;

    const tk = String(safeGet(rtt, ["accessToken"], acToken));
    const sp = safeGet(rtt, ["selectedProfile"]);
    const all = safeGet(rtt, ["availableProfiles"]);
    const ava = [];
    if (all instanceof Array) {
      for (const a of all) {
        if (!isNull(a)) {
          ava.push(toUserProfile(a));
        }
      }
    }
    return {
      success: true,
      availableProfiles: ava,
      selectedProfile: isNull(sp) ? selectedProfile : toUserProfile(sp),
      accessToken: tk,
    };
  } catch (e) {
    console.log(e);
    return { success: false, accessToken: "", availableProfiles: [] };
  }
}

export async function authenticate(
  accountName: string,
  password: string,
  authServer: string
): Promise<AuthenticateDataCallback> {
  try {
    const tURL = trimURL(authServer) + "/authenticate";
    const res = (
      await fetch(tURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
        body: JSON.stringify({
          username: accountName,
          password: password,
          clientToken: getUniqueID32(),
          agent: {
            name: "Minecraft",
            version: 1,
          },
        }),
      })
    ).body;
    const accessToken = String(safeGet(res, ["accessToken"], "") || "");
    if (accessToken === "undefined" || accessToken.length === 0) {
      return { success: false, accessToken: "", availableProfiles: [] };
    }
    let selectedProfile: RemoteUserProfile | undefined = undefined;
    const sObj = safeGet(res, ["selectedProfile"], null);
    if (!isNull(sObj)) {
      selectedProfile = toUserProfile(sObj);
    }

    const availableProfiles: RemoteUserProfile[] = [];
    const aList = safeGet(res, ["availableProfiles"], null);
    if (aList instanceof Array) {
      for (const x of aList) {
        if (!isNull(x)) {
          availableProfiles.push(toUserProfile(x));
        }
      }
    }

    return {
      availableProfiles,
      selectedProfile,
      accessToken,
      success: true,
    };
  } catch (e) {
    console.log(e);
    return {
      success: false,
      accessToken: "",
      availableProfiles: [],
    };
  }
}

function trimURL(url: string): string {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
}

export async function validateToken(
  acToken: string,
  authServer: string
): Promise<boolean> {
  try {
    await fetch(trimURL(authServer) + "/validate", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      cache: "no-cache",
      body: JSON.stringify({
        accessToken: acToken,
      }),
    });
    return true;
  } catch {
    return false;
  }
}

interface AuthenticateDataCallback {
  success: boolean;
  accessToken: string;
  availableProfiles: RemoteUserProfile[];
  selectedProfile?: RemoteUserProfile;
}

export interface RemoteUserProfile {
  id: string;
  name: string;
}

function toUserProfile(obj: unknown): RemoteUserProfile {
  const id = String(safeGet(obj, ["id"], ""));
  const name = String(safeGet(obj, ["name"], ""));
  return { id, name };
}

export function updateAccount(
  base: AuthlibAccount | MojangAccount,
  status: AuthenticateDataCallback
): void {
  if (status.success) {
    base.lastUsedAccessToken = status.accessToken;
    base.selectedProfile = status.selectedProfile;
    base.availableProfiles = status.availableProfiles;
    if (status.selectedProfile) {
      base.lastUsedUUID = status.selectedProfile?.id;
      base.lastUsedUsername = status.selectedProfile?.name;
    }
  }
}
