import { Account } from "./Account";
import { Trio } from "../commons/Collections";
import objectHash from "object-hash";

const OFFLINE_PLAYER_PREFIX = "OfflinePlayer:";

export class LocalAccount extends Account {
  constructor(name: string) {
    super(name);
    this.lastUsedUUID = buildOfflinePlayerUUID(name);
  }

  async buildAccessData(): Promise<Trio<string, string, string>> {
    return new Trio(
      this.lastUsedUsername,
      this.lastUsedAccessToken,
      this.lastUsedUUID
    );
  }

  async flushToken(): Promise<boolean> {
    this.lastUsedAccessToken = fakeToken();
    return true;
  }

  async isAccessTokenValid(): Promise<boolean> {
    return true;
  }

  async requireUserOperation(): Promise<boolean> {
    return true;
  }

  getAccountIdentifier(): string {
    return objectHash(this.accountName);
  }

  serialize(): string {
    return JSON.stringify({
      lastUsedUUID: this.lastUsedUUID,
      lastUsedAccessToken: this.lastUsedAccessToken,
      accountName: this.accountName,
      lastUsedUserName: this.lastUsedUsername,
      avatarURL: this.avatarURL,
    });
  }
}

function fakeToken(): string {
  return objectHash(Math.random()).slice(0, 32);
}

function buildOfflinePlayerUUID(p: string): string {
  return objectHash(OFFLINE_PLAYER_PREFIX + p);
}

// TODO load account
