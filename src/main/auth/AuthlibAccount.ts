import { Account } from "./Account";
import { Trio } from "../commons/Collections";
import got from "got";
import { getUniqueID32 } from "../security/Encrypt";
import { isNull, safeGet } from "../commons/Null";
import objectHash from "object-hash";

export class AuthlibAccount extends Account {
  async buildAccessData(): Promise<Trio<string, string, string>> {
    return new Trio<string, string, string>(
      this.lastUsedUsername,
      this.lastUsedAccessToken,
      this.lastUsedUUID
    );
  }

  async flushToken(): Promise<boolean> {
    this.lastUsedAccessToken = await refreshToken(
      this.lastUsedAccessToken,
      this.authServer,
      this.selectedProfile
    );
    return true;
  }

  getAccountIdentifier(): string {
    return objectHash(this.accountName);
  }

  async isAccessTokenValid(): Promise<boolean> {
    return await validateToken(this.lastUsedAccessToken, this.authServer);
  }

  async performAuth(password: string): Promise<boolean> {
    const st = await authenticate(this.accountName, password, this.authServer);
    if (!st.success) {
      return false;
    }
    this.lastUsedAccessToken = st.accessToken;
    this.selectedProfile = st.selectedProfile;
    this.availableProfiles = st.availableProfiles;
    if (this.selectedProfile) {
      this.lastUsedUUID = this.selectedProfile.id;
      this.lastUsedUsername = this.selectedProfile.name;
    }
    return true;
  }

  isAccountReady(): boolean {
    return !!this.selectedProfile;
  }

  async requireUserOperation(): Promise<boolean> {
    return true;
  }

  serialize(): string {
    return JSON.stringify({
      lastUsedUUID: this.lastUsedUUID,
      lastUsedAccessToken: this.lastUsedAccessToken,
      accountName: this.accountName,
      lastUsedUserName: this.lastUsedUsername,
      avatarURL: this.avatarURL,
      authServer: this.authServer,
    });
  }

  authServer: string;
  availableProfiles: RemoteUserProfile[] = [];
  selectedProfile: RemoteUserProfile | undefined;

  constructor(accountName: string, authServer: string) {
    super(accountName);
    this.authServer = authServer;
  }
}

async function refreshToken(
  acToken: string,
  authServer: string,
  selectedProfile?: RemoteUserProfile
): Promise<string> {
  try {
    const rtt = (
      await got.post(trimURL(authServer) + "/authserver/refresh", {
        headers: {
          "Content-Type": "application/json",
        },
        responseType: "json",
        body: JSON.stringify(
          Object.assign(
            {
              accessToken: acToken,
            },
            selectedProfile ? { selectedProfile } : {}
          )
        ),
      })
    ).body;

    return String(safeGet(rtt, ["accessToken"], acToken));
  } catch {
    return acToken;
  }
}

async function authenticate(
  accountName: string,
  password: string,
  authServer: string
): Promise<AuthenticateDataCallback> {
  try {
    const tURL = trimURL(authServer) + "/authserver/authenticate";
    const res = (
      await got.post(tURL, {
        responseType: "json",
        headers: {
          "Content-Type": "application/json",
        },
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
    const accessToken = String(safeGet(res, ["accessToken"], "") || "");
    return {
      availableProfiles,
      selectedProfile,
      accessToken,
      success: true,
    };
  } catch {
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

async function validateToken(
  acToken: string,
  authServer: string
): Promise<boolean> {
  try {
    await got.post(trimURL(authServer) + "/authserver/validate", {
      headers: {
        "Content-Type": "application/json",
      },
      responseType: "json",
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

interface RemoteUserProfile {
  id: string;
  name: string;
}

function toUserProfile(obj: unknown): RemoteUserProfile {
  const id = String(safeGet(obj, ["id"], ""));
  const name = String(safeGet(obj, ["name"], ""));
  return { id, name };
}
