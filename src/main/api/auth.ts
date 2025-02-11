import { accounts } from "@/main/auth/manage";
import { VanillaAccount } from "@/main/auth/vanilla";
import { games } from "@/main/game/manage";
import { ipcMain } from "@/main/ipc/typed";
import { reg } from "@/main/registry/registry";

ipcMain.handle("gameAuth", async (_, gameId) => {
    const g = reg.games.get(gameId);

    const a = g.launchHint.accountId ? accounts.get(g.launchHint.accountId) : new VanillaAccount();

    const success = await a.refresh();

    if (!success) return false;

    if (!g.launchHint.accountId) {
        const gs = structuredClone(g);
        gs.launchHint.accountId = a.uuid;
        games.add(gs);
    }

    // Update account
    reg.accounts.add(a.uuid, a.toProps());

    return true;
});

ipcMain.handle("listAccounts", () => reg.accounts.entries().map(([k, v]) => ({ ...v, uuid: k })));
