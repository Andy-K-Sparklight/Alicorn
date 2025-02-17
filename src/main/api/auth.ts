import { accounts } from "@/main/auth/manage";
import { VanillaAccount, type VanillaAccountProps } from "@/main/auth/vanilla";
import { games } from "@/main/game/manage";
import { ipcMain } from "@/main/ipc/typed";
import { reg } from "@/main/registry/registry";

ipcMain.handle("gameAuth", async (_, gameId) => {
    const g = reg.games.get(gameId);

    const a = g.launchHint.accountId ? accounts.get(g.launchHint.accountId) : new VanillaAccount();

    await a.refresh();

    if (!g.launchHint.accountId) {
        const gs = structuredClone(g);
        gs.launchHint.accountId = a.uuid;
        games.add(gs);
    }

    // Update account
    accounts.add(a);
});

ipcMain.handle("listAccounts", () => reg.accounts.entries().map(([k, v]) => ({ ...v, uuid: k })));

ipcMain.handle("createVanillaAccount", async () => {
    const a = new VanillaAccount();
    await a.refresh();
    accounts.add(a);
    return a.toProps() as VanillaAccountProps;
});
