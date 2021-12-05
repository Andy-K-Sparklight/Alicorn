import { Trio } from "../commons/Collections";
import { safeGet } from "../commons/Null";
import {
  Account,
  authenticate,
  refreshToken,
  RemoteUserProfile,
  updateAccount,
  validateToken,
} from "./Account";
import { AccountType } from "./AccountUtil";

const MJ_AUTH_SERVER_ROOT = "https://authserver.mojang.com";

// UNCHECKED
// Because I don't have a Mojang Account!
// I only have a Microsoft Account :(

// Mojang Account
// Simply forked from AuthlibAccount
export class MojangAccount extends Account {
  buildAccessData(): Promise<Trio<string, string, string>> {
    return Promise.resolve(
      new Trio<string, string, string>(
        this.lastUsedUsername,
        this.lastUsedAccessToken,
        this.lastUsedUUID
      )
    );
  }

  async flushToken(): Promise<boolean> {
    const p = await refreshToken(
      this.lastUsedAccessToken,
      MJ_AUTH_SERVER_ROOT,
      this.selectedProfile
    );
    updateAccount(this, p);
    return p.success;
  }

  async isAccessTokenValid(): Promise<boolean> {
    return await validateToken(this.lastUsedAccessToken, MJ_AUTH_SERVER_ROOT);
  }

  async performAuth(password: string): Promise<boolean> {
    const st = await authenticate(
      this.accountName,
      password,
      MJ_AUTH_SERVER_ROOT
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
    });
  }

  availableProfiles: RemoteUserProfile[] = [];
  selectedProfile: RemoteUserProfile | undefined;

  constructor(accountName: string) {
    super(accountName, AccountType.MOJANG);
  }
}
export async function getMojangSkinByUUID(a: Account): Promise<string> {
  try {
    const o = `https://sessionserver.mojang.com/session/minecraft/profile/${a.lastUsedUUID}`;

    const response = await (
      await fetch(o, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-cache",
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
    const bdecode = JSON.parse(Buffer.from(op, "base64").toString("utf-8"));
    const target = safeGet(bdecode, ["textures", "SKIN", "url"], "");
    return String(target);
  } catch {
    return "";
  }
}
