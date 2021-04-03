import { Trio } from "../commons/Collections";

export abstract class Account {
  protected constructor(accountName: string) {
    this.lastUsedUsername = "";
    this.accountName = accountName;
    this.lastUsedUUID = "";
    this.lastUsedAccessToken = "";
    this.avatarURL = "";
  }

  abstract requireUserOperation(): Promise<boolean>;

  abstract isAccessTokenValid(): Promise<boolean>;

  abstract flushToken(): Promise<boolean>;

  abstract buildAccessData(): Promise<Trio<string, string, string>>;

  // AccessData(or AuthData) is a Trio
  // Username, AccessToken, UUID

  abstract getAccountIdentifier(): string;

  abstract serialize(): string;

  lastUsedUsername: string;
  lastUsedUUID: string;
  lastUsedAccessToken: string;
  avatarURL: string;
  accountName: string;
}
