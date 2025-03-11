import type { DetailedAccountProps } from "@/main/auth/types";
import { accountsSlice } from "@/renderer/store/accounts";
import { globalStore, useAppSelector } from "@/renderer/store/store";

native.auth.onAccountChange(load);
void load();

async function load() {
    const accounts = await native.auth.getAccounts();
    globalStore.dispatch(accountsSlice.actions.replace({ accounts }));
}

export function useAccounts(): DetailedAccountProps[] {
    return useAppSelector(s => s.accounts.accounts);
}
