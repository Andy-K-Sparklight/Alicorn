import { Authenticator } from "./Authenticator";
import { AccountProfile } from "./AccountProfile";
import { Trio } from "../commons/Collections";
import hash from "object-hash";

// Local authenticator
// For development ONLY
export class LocalAuth implements Authenticator {
  async getAuthData(
    accountProfile: AccountProfile
  ): Promise<Trio<string, string, string>> {
    return new Trio<string, string, string>(
      accountProfile.username,
      fakeAccessToken(),
      accountProfile.uuid
    );
  }

  async requireUserOperation(): Promise<void> {
    return;
  }
}

// Only for development usages!
function fakeAccessToken(): string {
  return hash(Math.random()).slice(0, 32);
}
