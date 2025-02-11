import type { DetailedAccountProps } from "@/main/auth/types";
import { useEffect, useState } from "react";

export function useAccounts(): DetailedAccountProps[] {
    const [accounts, setAccounts] = useState<DetailedAccountProps[]>([]);

    useEffect(() => {
        // TODO handle errors
        // TODO refresh automatically when accounts change
        native.auth.getAccounts().then(setAccounts);
    }, []);

    return accounts;
}
