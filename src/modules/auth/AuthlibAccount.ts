import {
  Account,
  authenticate,
  refreshToken,
  RemoteUserProfile,
  updateAccount,
  validateToken,
} from "./Account";
import { Trio } from "../commons/Collections";
import objectHash from "object-hash";
import { AccountType } from "./AccountUtil";

// Account using Authlib Injector
export class AuthlibAccount extends Account {
  // Only gather information, this function doesn't do any authentication!
  async buildAccessData(): Promise<Trio<string, string, string>> {
    return new Trio<string, string, string>(
      this.lastUsedUsername,
      this.lastUsedAccessToken,
      this.lastUsedUUID
    );
  }

  // Get a new token
  async flushToken(): Promise<boolean> {
    console.log("Flushing token!");
    const p = await refreshToken(
      this.lastUsedAccessToken,
      this.authServer + "/authserver",
      this.selectedProfile
    );
    updateAccount(this, p);
    console.log(p.success);
    return p.success;
  }

  getAccountIdentifier(): string {
    return objectHash(this.accountName);
  }

  async isAccessTokenValid(): Promise<boolean> {
    return await validateToken(
      this.lastUsedAccessToken,
      this.authServer + "/authserver"
    );
  }

  async performAuth(password: string): Promise<boolean> {
    const st = await authenticate(
      this.accountName,
      password,
      this.authServer + "/authserver"
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
      authServer: this.authServer,
    });
  }

  authServer: string;
  availableProfiles: RemoteUserProfile[] = [];
  selectedProfile: RemoteUserProfile | undefined;

  constructor(accountName: string, authServer: string) {
    super(accountName, AccountType.AUTHLIB_INJECTOR);
    this.authServer = authServer;
  }
}
