import type { DetailedAccountProps } from "@/main/auth/types";
import { globalStore, useAppSelector } from "@/renderer/store/store";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

native.auth.onAccountChange(load);
void load();

interface AccountsSliceState {
    accounts: DetailedAccountProps[];
}

export const accountsSlice = createSlice({
    name: "accounts",
    initialState: {
        accounts: []
    } as AccountsSliceState,
    reducers: {
        replace(state, action: PayloadAction<{ accounts: DetailedAccountProps[] }>) {
            state.accounts = action.payload.accounts;
        }
    }
});

async function load() {
    const accounts = await native.auth.getAccounts();
    globalStore.dispatch(accountsSlice.actions.replace({ accounts }));
}

export function useAccounts(): DetailedAccountProps[] {
    return useAppSelector(s => s.accounts.accounts);
}
