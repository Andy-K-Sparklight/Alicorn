import { accounts } from "@/main/auth/manage";
import { skin } from "@/main/auth/skin";
import { VanillaAccount, type VanillaAccountProps } from "@/main/auth/vanilla";
import { YggdrasilAccount, type YggdrasilAccountProps } from "@/main/auth/yggdrasil";
import { games } from "@/main/game/manage";
import { ipcMain } from "@/main/ipc/typed";
import { reg } from "@/main/registry/registry";
import { alter } from "@/main/util/misc";

export type GameAuthResult = true | { host: string, email: string }

ipcMain.handle("gameAuth", async (_, gameId, pwd) => {
    const g = games.get(gameId);

    const a = g.launchHint.accountId ? accounts.get(g.launchHint.accountId) : new VanillaAccount();
    if (a instanceof YggdrasilAccount) {
        if (pwd) {
            await a.login(pwd);
        } else {
            try {
                await a.refresh();
            } catch {
                return { host: a.host, email: a.email };
            }
        }
    } else {
        await a.refresh();
    }

    if (!g.launchHint.accountId) {
        games.add(alter(g, g => g.launchHint.accountId = a.uuid));
    }

    // Update account
    accounts.add(a);
    return true;
});

ipcMain.handle("listAccounts", () => reg.accounts.entries().map(([k, v]) => ({ ...v, uuid: k })));

ipcMain.handle("createVanillaAccount", async () => {
    const a = new VanillaAccount();
    await a.refresh();
    accounts.add(a);
    return a.toProps() as VanillaAccountProps;
});

ipcMain.handle("createYggdrasilAccount", async (_, host, email, pwd) => {
    const a = new YggdrasilAccount(host, email);
    await a.login(pwd);
    accounts.add(a);
    return a.toProps() as YggdrasilAccountProps;
});

ipcMain.handle("getAccountSkin", async (_, accountId) => {
    try {
        const a = accounts.get(accountId);
        return await skin.getSkin(a);
    } catch (e) {
        console.error("Unable to query skin");
        console.error(e);
        return "";
    }
});

ipcMain.handle("getAccountSkinAvatar", async (_, accountId) => {
    try {
        const a = accounts.get(accountId);
        return await skin.getSkinAvatar(a);
    } catch (e) {
        console.error("Unable to query skin");
        console.error(e);
        return ["", ""] as const;
    }
});
