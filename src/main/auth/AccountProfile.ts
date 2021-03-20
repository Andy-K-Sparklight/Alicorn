// Only contains username and uuid, no password
// Password will be loaded through a safe gate
// 'uuid' is ONLY for local accounts and is ONLY used to custom uuid
// In other cases, 'uuid' will be simply ignored by the authenticator
export class AccountProfile {
  username: string;
  uuid: string;

  constructor(username: string, uuid: string) {
    this.username = username;
    this.uuid = uuid;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  static fromString(source: string): AccountProfile {
    try {
      const obj: Record<string, unknown> = JSON.parse(source);
      return new AccountProfile(
        String(obj["username"] || "Unknown"),
        String(obj["uuid"] || "")
      );
    } catch {
      return new AccountProfile("Unknown", "");
    }
  }
}
