import { AuthlibAccount } from "./AuthlibAccount";
import { AccountType } from "./AccountUtil";

export class Nide8Account extends AuthlibAccount {
  serverId: string;

  constructor(accountName: string, serverId: string) {
    super(
      accountName,
      `https://auth2.nide8.com:233/${serverId}`,
      AccountType.NIDE8
    );
    this.serverId = serverId;
  }

  serialize(): string {
    return JSON.stringify({
      lastUsedUUID: this.lastUsedUUID,
      lastUsedAccessToken: this.lastUsedAccessToken,
      accountName: this.accountName,
      lastUsedUsername: this.lastUsedUsername,
      authServer: this.authServer,
      serverId: this.serverId,
    });
  }
}
