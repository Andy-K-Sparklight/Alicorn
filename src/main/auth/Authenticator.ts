import { Trio } from "../commons/Collections";
import { AccountProfile } from "./AccountProfile";

export interface Authenticator {
  // This trio contains 'username', 'accessToken' and 'uuid'
  // The return value 'username' is invented to handler email authentications
  // The input 'username' should be the email
  // The output 'username' should be the player name which is used as '${auth_player_name}' in those args
  getAuthData(
    accountProfile: AccountProfile
  ): Promise<Trio<string, string, string>>;

  // For Microsoft login, we shall allocate time for that
  requireUserOperation(): Promise<void>;
}
