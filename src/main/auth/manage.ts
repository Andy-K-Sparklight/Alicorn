import { NamedRegistry, registry } from "@/main/registry/registry";
import { Account } from "@/main/auth/spec";
import { LocalAccount } from "@/main/auth/local";
import { MSAccount } from "@/main/auth/ms";

let ent: NamedRegistry<Account>;

async function load() {
    if (!ent) {
        ent = await registry.loadNamed("accounts", { LocalAccount, MSAccount });
    }
}

function entries() {
    return ent;
}

export const accounts = {
    load, entries
};

