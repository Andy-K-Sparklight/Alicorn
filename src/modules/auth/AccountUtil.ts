import fs from "fs-extra";
import path from "path";
import { Pair, Trio } from "../commons/Collections";
import { ALICORN_ENCRYPTED_DATA_SUFFIX } from "../commons/Constants";
import {
  getActualDataPath,
  loadData,
  saveData,
  saveDataSync,
} from "../config/DataSupport";
import { decryptByMachine, encryptByMachine } from "../security/Encrypt";
import { Account } from "./Account";
import { AuthlibAccount } from "./AuthlibAccount";
import { LocalAccount } from "./LocalAccount";
import { MicrosoftAccount } from "./MicrosoftAccount";
import { MojangAccount } from "./MojangAccount";
import { Nide8Account } from "./Nide8Account";

// Account Prefix
// DO NOT EDIT THIS - VALUES ARE VERY ESSENTIAL
// $AL! Alicorn Local Account
// $MZ! Microsoft Account
// $BJ! Mojang Account
// $AJ! Authlib Injector
// $ND! Nide8
enum AccountType {
  MICROSOFT = "$MZ!",
  ALICORN = "$AL!",
  AUTHLIB_INJECTOR = "$AJ!",
  MOJANG = "$BJ!",
  NIDE8 = "$ND!",
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
    await reloadAccounts();
    return true;
  } catch {
    return false;
  }
}

export function saveAccountSync(a: Account): boolean {
  try {
    const fName = a.getAccountIdentifier() + ALICORN_ENCRYPTED_DATA_SUFFIX;
    saveDataSync(
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

export async function loadAccount(fName: string): Promise<Account | null> {
  try {
    const s = await loadData(path.join(ACCOUNT_ROOT, fName));
    const deS = decryptByMachine(s);
    const p = decideWhichAccountByHead(deS);
    switch (p.getFirstValue()) {
      case AccountType.NIDE8:
        return loadNDAccount(p.getSecondValue());
      case AccountType.AUTHLIB_INJECTOR:
        return loadAJAccount(p.getSecondValue());
      case AccountType.MOJANG:
        return loadMJAccount(p.getSecondValue());
      case AccountType.MICROSOFT:
        return loadMSAccount(p.getSecondValue());
      case AccountType.ALICORN:
      default:
        return loadLocalAccount(p.getSecondValue());
    }
  } catch {
    return null;
  }
}

function loadLocalAccount(obj: Record<string, unknown>): LocalAccount {
  const la = new LocalAccount(String(obj["accountName"] || ""));
  la.lastUsedUsername = String(obj["lastUsedUsername"] || "");
  la.lastUsedAccessToken = String(obj["lastUsedAccessToken"] || "");
  la.lastUsedUUID = String(obj["lastUsedUUID"] || "");
  return la;
}

function loadNDAccount(obj: Record<string, unknown>): Nide8Account {
  const la = new Nide8Account(
    String(obj["accountName"] || ""),
    String(obj["serverId"] || "")
  );
  la.lastUsedUsername = String(obj["lastUsedUsername"] || "");
  la.lastUsedAccessToken = String(obj["lastUsedAccessToken"] || "");
  la.lastUsedUUID = String(obj["lastUsedUUID"] || "");
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
  return la;
}

function loadMJAccount(obj: Record<string, unknown>): MojangAccount {
  const la = new MojangAccount(String(obj["accountName"] || ""));
  la.lastUsedUsername = String(obj["lastUsedUsername"] || "");
  la.lastUsedAccessToken = String(obj["lastUsedAccessToken"] || "");
  la.lastUsedUUID = String(obj["lastUsedUUID"] || "");
  return la;
}

function loadMSAccount(obj: Record<string, unknown>): MicrosoftAccount {
  const la = new MicrosoftAccount(String(obj["accountName"] || ""));
  la.lastUsedUsername = String(obj["lastUsedUsername"] || "");
  la.lastUsedAccessToken = String(obj["lastUsedAccessToken"] || "");
  la.lastUsedUUID = String(obj["lastUsedUUID"] || "");
  la.refreshToken = String(obj["refreshToken"] || "");
  return la;
}

function decideWhichAccountByCls(a: Account): AccountType {
  if (a instanceof Nide8Account) {
    return AccountType.NIDE8;
  }
  if (a instanceof AuthlibAccount) {
    return AccountType.AUTHLIB_INJECTOR;
  }
  if (a instanceof MojangAccount) {
    return AccountType.MOJANG;
  }
  if (a instanceof MicrosoftAccount) {
    return AccountType.MICROSOFT;
  }
  return AccountType.ALICORN;
}

function decideWhichAccountByHead(
  str: string
): Pair<AccountType, Record<string, unknown>> {
  try {
    let p1;
    const p2 = JSON.parse(str.slice(4));
    switch (str.slice(0, 4)) {
      case AccountType.NIDE8:
        p1 = AccountType.NIDE8;
        break;
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

export async function removeAccount(fName: string): Promise<void> {
  try {
    await fs.remove(getActualDataPath(path.join(ACCOUNT_ROOT, fName)));
  } catch {}
}

export function copyAccount(aIn: Account | undefined): Account {
  if (aIn === undefined) {
    return new LocalAccount("Player");
  }
  switch (aIn.type) {
    case AccountType.NIDE8: {
      const ai = aIn as Nide8Account;
      const ac = new Nide8Account(aIn.accountName, ai.serverId);
      ac.availableProfiles = ai.availableProfiles;
      ac.accountName = ai.accountName;
      ac.lastUsedUUID = ai.lastUsedUUID;
      ac.lastUsedAccessToken = ai.lastUsedAccessToken;
      ac.lastUsedUsername = ai.lastUsedUsername;
      ac.selectedProfile = ai.selectedProfile;
      return ac;
    }
    case AccountType.MICROSOFT:
      return new MicrosoftAccount(aIn.accountName);
    case AccountType.MOJANG: {
      const ac = new MojangAccount(aIn.accountName);
      const ai = aIn as MojangAccount;
      ac.availableProfiles = ai.availableProfiles;
      ac.accountName = ai.accountName;
      ac.lastUsedUUID = ai.lastUsedUUID;
      ac.lastUsedAccessToken = ai.lastUsedAccessToken;
      ac.lastUsedUsername = ai.lastUsedUsername;
      ac.selectedProfile = ai.selectedProfile;
      return ac;
    }
    case AccountType.AUTHLIB_INJECTOR: {
      const ai = aIn as AuthlibAccount;
      const ac = new AuthlibAccount(aIn.accountName, ai.authServer);
      ac.availableProfiles = ai.availableProfiles;
      ac.accountName = ai.accountName;
      ac.lastUsedUUID = ai.lastUsedUUID;
      ac.lastUsedAccessToken = ai.lastUsedAccessToken;
      ac.lastUsedUsername = ai.lastUsedUsername;
      ac.selectedProfile = ai.selectedProfile;
      return ac;
    }
    case AccountType.ALICORN:
    default:
      return new LocalAccount(aIn.accountName);
  }
}

export async function fillAccessData(
  acData: Trio<string, string, string>
): Promise<Trio<string, string, string>> {
  for (const v of acData.get()) {
    if (v.trim().length === 0) {
      return await new LocalAccount("Player").buildAccessData();
    }
  }
  return acData;
}

let ACCOUNT_SET: Set<Account> = new Set();

export async function reloadAccounts(): Promise<void> {
  try {
    const a = await getAllAccounts();
    const builtAccount: Set<Account> = new Set<Account>();
    for (const accountFile of a) {
      const r = await loadAccount(accountFile);
      if (r) {
        builtAccount.add(r);
      }
    }
    ACCOUNT_SET = builtAccount;
  } catch {}
}
export function getPresentAccounts(): Set<Account> {
  return ACCOUNT_SET;
}
