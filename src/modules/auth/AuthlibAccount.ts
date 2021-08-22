import { uniqueHash } from "../commons/BasicHash";
import { Trio } from "../commons/Collections";
import {
  Account,
  authenticate,
  refreshToken,
  RemoteUserProfile,
  updateAccount,
  validateToken,
} from "./Account";
import { AccountType } from "./AccountUtil";

// Account using Authlib Injector
export class AuthlibAccount extends Account {
  // Only gather information, this function doesn't do any authentication!
  buildAccessData(): Promise<Trio<string, string, string>> {
    return Promise.resolve(
      new Trio<string, string, string>(
        this.lastUsedUsername,
        this.lastUsedAccessToken,
        this.lastUsedUUID
      )
    );
  }

  // Get a new token
  async flushToken(): Promise<boolean> {
    const p = await refreshToken(
      this.lastUsedAccessToken,
      this.authServer + "/authserver",
      this.selectedProfile
    );
    updateAccount(this, p);
    return p.success;
  }

  getAccountIdentifier(): string {
    return uniqueHash(this.accountName);
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
      authServer: this.authServer,
    });
  }

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
}
