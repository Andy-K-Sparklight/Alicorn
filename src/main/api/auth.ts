import { ipcMain } from "@/main/ipc/typed";
import { reg } from "@/main/registry/registry";

ipcMain.handle("gameAuth", (_, gameId) => {
    const g = reg.games.get(gameId);
    const a = reg.accounts.get(g.launchHint.accountId);
    return a.refresh();
});
