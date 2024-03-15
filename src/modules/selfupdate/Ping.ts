// The data sent has already been hash encoded and is almost irreversible.

import { abortableUniqueHash } from "../commons/BasicHash";
import { getBoolean } from "../config/ConfigSupport";
import { getMachineUniqueID } from "../security/Unique";

const PING_KEY = "AlicornPing.LastPing";
const PING_TARGET = "https://almc-ping.thatrarityegmc.workers.dev/";

export async function todayPing(): Promise<void> {
    if (!getBoolean("alicorn-ping")) {
        return;
    }
    const d0 = getDay();
    const o = localStorage.getItem(PING_KEY);
    if (d0 !== o) {
        try {
            const r = await fetch(PING_TARGET, {
                method: "GET",
                headers: {
                    "X-Alicorn-Identifier": await abortableUniqueHash(
                        await getMachineUniqueID()
                    )
                },
                credentials: "omit"
            });
            if (r.ok) {
                localStorage.setItem(PING_KEY, getDay());
                console.log("Ping success!");
            } else {
                console.log("Ping failed, try again next time...");
            }
        } catch {
            console.log("Ping failed, try again next time...");
        }
    } else {
        console.log("Already sent ping today!");
    }
}

function getDay(): string {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
