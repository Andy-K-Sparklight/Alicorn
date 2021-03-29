import { Account } from "./Account";
import { Trio } from "../commons/Collections";
import objectHash from "object-hash";

// UNCHECKED

const OFFLINE_PLAYER_PREFIX = "OfflinePlayer:";

export class LocalAccount extends Account {
  constructor(name: string) {
    super(name, "");
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

  async refresh(): Promise<boolean> {
    await this.flushUsername();
    await this.flushToken();
    return true;
  }

  async requireUserOperation(): Promise<boolean> {
    return true;
  }

  async flushUsername(): Promise<boolean> {
    this.lastUsedUsername = this.accountName;
    return true;
  }

  async flushUUID(): Promise<boolean> {
    this.lastUsedUUID = buildOfflinePlayerUUID(this.accountName);
    return true;
  }

  getAccountIdentifier(): string {
    return objectHash(this.accountName);
  }
}

function fakeToken(): string {
  return objectHash(Math.random()).slice(0, 32);
}

function buildOfflinePlayerUUID(p: string): string {
  return objectHash(OFFLINE_PLAYER_PREFIX + p);
}
