import { v3 } from "uuid";
import { basicHash } from "../commons/BasicHash";
import { Trio } from "../commons/Collections";
import { Account } from "./Account";
import { AccountType } from "./AccountUtil";
const OFFLINE_PLAYER_PREFIX = "OfflinePlayer:";
const AL_UUID = "60e991ef-5602-479f-85d3-dd72ff93ae68";
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

  flushToken(): Promise<boolean> {
    this.lastUsedAccessToken = fakeToken();
    return Promise.resolve(true);
  }

  isAccessTokenValid(): Promise<boolean> {
    return Promise.resolve(true);
  }

  performAuth(_password: string): Promise<boolean> {
    return Promise.resolve(true);
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
  return basicHash(Math.random()).slice(0, 32);
}

function buildOfflinePlayerUUID(p: string): string {
  return v3(OFFLINE_PLAYER_PREFIX + p, AL_UUID);
}
