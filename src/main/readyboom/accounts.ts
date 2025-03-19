import { accounts } from "@/main/auth/manage";
import { VanillaAccount } from "@/main/auth/vanilla";
import { conf } from "@/main/conf/conf";
import { reg } from "@/main/registry/registry";

async function keepAccountsAlive() {
    if (!conf().runtime.readyboom) return;

    const a = reg.accounts.entries().map(e => e[0]);
    await Promise.allSettled(a.map(async id => {
        const ac = accounts.get(id);

        if (ac instanceof VanillaAccount) {
            console.debug(`Refreshing account ${id}`);
            await ac.refreshQuietly();
            console.debug(`Account is now alive: ${id}`);
            accounts.add(ac);
        }
    }));
}

export const rbAccounts = {
    keepAccountsAlive
};
