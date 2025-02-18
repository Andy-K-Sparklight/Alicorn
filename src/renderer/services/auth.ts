import type { DetailedAccountProps } from "@/main/auth/types";
import Emittery from "emittery";
import { useSyncExternalStore } from "react";

let accounts: DetailedAccountProps[] = [];
const emitter = new Emittery();

native.auth.onAccountChange(load);
void load();

async function load() {
    accounts = await native.auth.getAccounts();
    void emitter.emit("change");
}

function subscribe(cb: () => void) {
    emitter.on("change", cb);

    return () => emitter.off("change", cb);
}

function getSnapshot() {
    if (!accounts) {
        void load();
    }
    return accounts;
}

export function useAccounts(): DetailedAccountProps[] {
    return useSyncExternalStore(subscribe, getSnapshot);
}
