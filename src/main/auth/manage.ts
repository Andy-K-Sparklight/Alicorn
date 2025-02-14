import { TemporalAccount } from "@/main/auth/temp";
import type { Account, AccountProps } from "@/main/auth/types";
import { VanillaAccount } from "@/main/auth/vanilla";
import { reg } from "@/main/registry/registry";

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

export const accounts = {
    get
};
