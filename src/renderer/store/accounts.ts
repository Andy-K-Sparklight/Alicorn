import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DetailedAccountProps } from "@/main/auth/types";

interface AccountsSliceState {
    accounts: DetailedAccountProps[];
}

export const accountsSlice = createSlice({
    name: "accounts",
    initialState: {
        accounts: [],
    } as AccountsSliceState,
    reducers: {
        replace(state, action: PayloadAction<{ accounts: DetailedAccountProps[] }>) {
            state.accounts = action.payload.accounts;
        },
    },
});
