import {
  Account,
  authenticate,
  refreshToken,
  RemoteUserProfile,
  updateAccount,
  validateToken,
} from "./Account";
import { Trio } from "../commons/Collections";
import { AccountType } from "./AccountUtil";

const MJ_AUTH_SERVER_ROOT = "https://authserver.mojang.com";

// UNCHECKED
// Because I don't have a Mojang Account!
// I only have a Microsoft Account :(

// Mojang Account
// Simply forked from AuthlibAccount
export class MojangAccount extends Account {
  async buildAccessData(): Promise<Trio<string, string, string>> {
    return new Trio<string, string, string>(
      this.lastUsedUsername,
      this.lastUsedAccessToken,
      this.lastUsedUUID
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
    updateAccount(this, st);
    return true;
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
