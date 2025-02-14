import { TemporalAccount } from "@/main/auth/temp";
import type { Account, AccountProps } from "@/main/auth/types";
import { VanillaAccount } from "@/main/auth/vanilla";
import { reg } from "@/main/registry/registry";
import { BrowserWindow } from "electron";

function loadFromProps(props: AccountProps): Account {
    switch (props.type) {
        case "vanilla":
            return VanillaAccount.fromProps(props);
        case "local":
            return TemporalAccount.fromProps(props);
    }
}

function get(accountId: string): Account {
    return loadFromProps(reg.accounts.get(accountId));
}

function add(account: Account) {
    reg.accounts.add(account.uuid, account.toProps());
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send("accountChanged"));
}

export const accounts = {
    get, add
};
