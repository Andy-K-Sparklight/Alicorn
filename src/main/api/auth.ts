import { accounts } from "@/main/auth/manage";
import { VanillaAccount } from "@/main/auth/vanilla";
import { ipcMain } from "@/main/ipc/typed";
import { reg } from "@/main/registry/registry";

ipcMain.handle("gameAuth", async (_, gameId) => {
    const g = reg.games.get(gameId);

    const a = g.launchHint.accountId ? accounts.get(g.launchHint.accountId) : new VanillaAccount();

    const success = await a.refresh();

    if (success) {
        g.launchHint.accountId = a.uuid;
    }

    return success;
});
