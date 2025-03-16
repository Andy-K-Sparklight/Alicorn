import { accounts } from "@/main/auth/manage";
import { skin } from "@/main/auth/skin";
import { VanillaAccount, type VanillaAccountProps } from "@/main/auth/vanilla";
import { YggdrasilAccount, type YggdrasilAccountProps } from "@/main/auth/yggdrasil";
import { games } from "@/main/game/manage";
import { addCheckedHandler } from "@/main/ipc/checked";
import { reg } from "@/main/registry/registry";
import { alter } from "@/main/util/misc";

export type GameAuthResult = true | { host: string, email: string }

addCheckedHandler("gameAuth", async (gameId, pwd) => {
    const g = games.get(gameId);
    const aid = g.launchHint.accountId === "new" ? "" : g.launchHint.accountId;
    const a = aid ? accounts.get(aid) : new VanillaAccount();

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

    if (!aid) {
        games.add(alter(g, g => g.launchHint.accountId = a.uuid));
    }

    // Update account
    accounts.add(a);
    return true;
});

addCheckedHandler("listAccounts", () => reg.accounts.entries().map(([k, v]) => ({ ...v, uuid: k })));

addCheckedHandler("createVanillaAccount", async () => {
    const a = new VanillaAccount();
    await a.refresh();
    accounts.add(a);
    return a.toProps() as VanillaAccountProps;
});

addCheckedHandler("createYggdrasilAccount", async (host, email, pwd) => {
    const a = new YggdrasilAccount(host, email);
    await a.login(pwd);
    accounts.add(a);
    return a.toProps() as YggdrasilAccountProps;
});

addCheckedHandler("getAccountSkin", async accountId => {
    try {
        const a = accounts.get(accountId);
        return await skin.getSkin(a);
    } catch (e) {
        console.error("Unable to query skin");
        console.error(e);
        return "";
    }
});

addCheckedHandler("getAccountSkinAvatar", async accountId => {
    try {
        const a = accounts.get(accountId);
        return await skin.getSkinAvatar(a);
    } catch (e) {
        console.error("Unable to query skin");
        console.error(e);
        return ["", ""] as const;
    }
});
