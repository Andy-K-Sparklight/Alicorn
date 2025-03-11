import { TemporalAccount } from "@/main/auth/temp";
import type { Account, AccountProps } from "@/main/auth/types";
import { VanillaAccount } from "@/main/auth/vanilla";
import { YggdrasilAccount } from "@/main/auth/yggdrasil";
import { reg } from "@/main/registry/registry";
import { windowControl } from "@/main/sys/window-control";

const accountMap = new Map<string, Account>();

function loadFromProps(props: AccountProps): Account {
    switch (props.type) {
        case "vanilla":
            return VanillaAccount.fromProps(props);
        case "local":
            return TemporalAccount.fromProps(props);
        case "yggdrasil":
            return YggdrasilAccount.fromProps(props);
    }
}

function get(accountId: string): Account {
    // Single-instance of accounts are important to avoid conflict during authentication
    let a = accountMap.get(accountId);
    if (!a) {
        a = loadFromProps(reg.accounts.get(accountId));
        accountMap.set(accountId, a);
    }

    return a;
}

function add(account: Account) {
    reg.accounts.add(account.uuid, account.toProps());
    windowControl.getMainWindow()?.webContents.send("accountChanged");
}

export const accounts = {
    get, add
};
