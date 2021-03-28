import { Trio } from "../commons/Collections";

export abstract class Account {
  protected constructor(accountName: string, password: string) {
    this.lastUsedUsername = "";
    this.accountName = accountName;
    this.password = password;
    this.lastUsedUUID = "";
    this.lastUsedAccessToken = "";
    this.avatarURL = "";
  }

  abstract requireUserOperation(): Promise<boolean>;

  abstract isAccessTokenValid(): Promise<boolean>;

  abstract flushUUID(): Promise<boolean>;

  abstract refresh(): Promise<boolean>;

  abstract flushToken(): Promise<boolean>;

  abstract flushUsername(): Promise<boolean>;

  abstract buildAccessData(): Promise<Trio<string, string, string>>;

  // TODO save account data

  lastUsedUsername: string;
  password: string;
  lastUsedUUID: string;
  lastUsedAccessToken: string;
  avatarURL: string;
  readonly accountName: string;
}
