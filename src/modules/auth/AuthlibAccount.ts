import {
  Account,
  authenticate,
  refreshToken,
  RemoteUserProfile,
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
    const p = await refreshToken(
      this.lastUsedAccessToken,
      this.authServer + "/authserver",
      this.selectedProfile
    );
    if (p.success) {
      this.lastUsedAccessToken = p.accessToken;
      this.selectedProfile = p.selectedProfile;
      this.availableProfiles = p.availableProfiles;
      if (p.selectedProfile) {
        this.lastUsedUUID = p.selectedProfile?.id;
        this.lastUsedUsername = p.selectedProfile?.name;
      }
    }

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
