import { Account } from "./Account";
import { Trio } from "../commons/Collections";
import objectHash from "object-hash";
import { AccountType } from "./AccountUtil";

const OFFLINE_PLAYER_PREFIX = "OfflinePlayer:";

export class LocalAccount extends Account {
  constructor(name: string) {
    super(name, AccountType.ALICORN);
    this.lastUsedUsername = name;
    this.lastUsedUUID = buildOfflinePlayerUUID(name);
  }

  async buildAccessData(): Promise<Trio<string, string, string>> {
    await this.flushToken();
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

  async performAuth(password: string): Promise<boolean> {
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
}

function fakeToken(): string {
  return objectHash(Math.random()).slice(0, 32);
}

function buildOfflinePlayerUUID(p: string): string {
  return objectHash(OFFLINE_PLAYER_PREFIX + p);
}
