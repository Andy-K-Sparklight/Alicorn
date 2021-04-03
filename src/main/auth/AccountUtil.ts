import { LocalAccount } from "./LocalAccount";
import { Pair } from "../commons/Collections";
import { AuthlibAccount } from "./AuthlibAccount";
import { Account } from "./Account";
import { ALICORN_ENCRYPTED_DATA_SUFFIX } from "../commons/Constants";
import { getActualDataPath, loadData, saveData } from "../config/DataSupport";
import path from "path";
import { decryptByMachine, encryptByMachine } from "../security/Encrypt";
import fs from "fs-extra";

// Account Prefix
// $AL! Alicorn Local Account
// $MZ! Microsoft Account
// $BJ! Mojang Account
// $AJ! Authlib Injector
enum AccountType {
  MICROSOFT = "$MZ!",
  ALICORN = "$AL!",
  AUTHLIB_INJECTOR = "$AJ!",
  MOJANG = "$BJ!",
}

const ACCOUNT_ROOT = "accounts";

export { AccountType };

export async function saveAccount(a: Account): Promise<boolean> {
  try {
    const fName = a.getAccountIdentifier() + ALICORN_ENCRYPTED_DATA_SUFFIX;
    await saveData(
      path.join(ACCOUNT_ROOT, fName),
      encryptByMachine(decideWhichAccountByCls(a) + a.serialize())
    );
    return true;
  } catch {
    return false;
  }
}

export async function getAllAccounts(): Promise<string[]> {
  try {
    return await fs.readdir(getActualDataPath(ACCOUNT_ROOT));
  } catch {
    return [];
  }
}

export async function loadAccount(fName: string): Promise<Account> {
  try {
    const s = await loadData(path.join(ACCOUNT_ROOT, fName));
    const deS = decryptByMachine(s);
    const p = decideWhichAccountByHead(deS);
    switch (p.getFirstValue()) {
      case AccountType.AUTHLIB_INJECTOR:
        return loadAJAccount(p.getSecondValue());
      // TODO other types
      case AccountType.ALICORN:
      default:
        return loadLocalAccount(p.getSecondValue());
    }
  } catch {
    return new LocalAccount("");
  }
}

function loadLocalAccount(obj: Record<string, unknown>): LocalAccount {
  const la = new LocalAccount(String(obj["accountName"] || ""));
  la.lastUsedUsername = String(obj["lastUsedUsername"] || "");
  la.lastUsedAccessToken = String(obj["lastUsedAccessToken"] || "");
  la.lastUsedUUID = String(obj["lastUsedUUID"] || "");
  la.avatarURL = String(obj["avatarURL"] || "");
  return la;
}

function loadAJAccount(obj: Record<string, unknown>): AuthlibAccount {
  const la = new AuthlibAccount(
    String(obj["accountName"] || ""),
    String(obj["authServer"] || "")
  );
  la.lastUsedUsername = String(obj["lastUsedUsername"] || "");
  la.lastUsedAccessToken = String(obj["lastUsedAccessToken"] || "");
  la.lastUsedUUID = String(obj["lastUsedUUID"] || "");
  la.avatarURL = String(obj["avatarURL"] || "");
  return la;
}

function decideWhichAccountByCls(a: Account): AccountType {
  // TODO not finished
  if (a instanceof AuthlibAccount) {
    return AccountType.AUTHLIB_INJECTOR;
  }
  return AccountType.ALICORN;
}

function decideWhichAccountByHead(
  str: string
): Pair<AccountType, Record<string, unknown>> {
  try {
    let p1;
    const p2 = JSON.parse(str.slice(4));
    switch (str.slice(4)) {
      case AccountType.MICROSOFT:
        p1 = AccountType.MICROSOFT;
        break;
      case AccountType.MOJANG:
        p1 = AccountType.MOJANG;
        break;
      case AccountType.AUTHLIB_INJECTOR:
        p1 = AccountType.AUTHLIB_INJECTOR;
        break;
      case AccountType.ALICORN:
      default:
        p1 = AccountType.ALICORN;
        break;
    }
    return new Pair<AccountType, Record<string, unknown>>(p1, p2);
  } catch {
    return new Pair<AccountType, Record<string, unknown>>(
      AccountType.ALICORN,
      {}
    );
  }
}
