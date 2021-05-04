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
import { isNull } from "../commons/Null";

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
    console.log("Performing auth!");
    const st = await authenticate(
      this.accountName,
      password,
      this.authServer + "/authserver"
    );
    if (!st.success) {
      return false;
    }
    console.log("Successfully received data!");
    console.log(st);
    this.lastUsedAccessToken = st.accessToken;
    this.selectedProfile = st.selectedProfile;
    this.availableProfiles = st.availableProfiles;
    if (!isNull(st.selectedProfile)) {
      console.log("Gotcha!");
      console.log(st.selectedProfile);
      // @ts-ignore
      this.lastUsedUUID = st.selectedProfile.id;
      // @ts-ignore
      this.lastUsedUsername = st.selectedProfile.name;
    }
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
