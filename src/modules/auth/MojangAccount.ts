import {
  Account,
  authenticate,
  refreshToken,
  RemoteUserProfile,
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

  async isAccessTokenValid(): Promise<boolean> {
    return await validateToken(this.lastUsedAccessToken, MJ_AUTH_SERVER_ROOT);
  }

  async performAuth(password: string): Promise<boolean> {
    const st = await authenticate(
      this.accountName,
      password,
      MJ_AUTH_SERVER_ROOT
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
