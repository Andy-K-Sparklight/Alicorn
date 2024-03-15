import { uniqueHash } from "../commons/BasicHash";
import { isNull } from "../commons/Null";
import { getMachineUniqueID } from "../security/Unique";

export interface OnlineGameInfo {
    network: string;
    password: string;
    message: string;
    ip: string;
    port: number;
    baseVersion: string;
    premium: boolean;
    nextIP: number;
}

export function applyCode(
    code: string,
    central: string
): Promise<OnlineGameInfo> {
    const target = `ws://${central}`;
    const ws = new WebSocket(target);
    return new Promise<OnlineGameInfo>((res, rej) => {
        const s = setTimeout(() => {
            ws.close();
            rej();
        }, 5000);
        ws.onmessage = (e) => {
            clearTimeout(s);
            try {
                const r = JSON.parse(String(e.data));
                if (!isNull(r.network) && !isNull(r.password)) {
                    // Two checks ok then fine
                    res(r as OnlineGameInfo);
                } else {
                    rej();
                }
            } catch {
                rej();
            }
        };
        ws.onopen = () => {
            ws.send(JSON.stringify({type: "use", id: code}));
        };
    });
}

export function deactiveCode(code: string, central: string): Promise<void> {
    const target = `ws://${central}`;
    const ws = new WebSocket(target);
    return new Promise<void>((res, rej) => {
        void (async () => {
            const mid = uniqueHash(await getMachineUniqueID());
            const s = setTimeout(() => {
                ws.close();
                rej();
            }, 5000);
            ws.onmessage = () => {
                clearTimeout(s);
                res();
            };
            ws.onopen = () => {
                ws.send(JSON.stringify({type: "deactive", id: code, secret: mid}));
            };
        })();
    });
}

export function acquireCode(
    info: OnlineGameInfo,
    expires: number, // In ms
    count: number,
    central: string
): Promise<string> {
    const target = `ws://${central}`;
    const ws = new WebSocket(target);
    return new Promise<string>((res, rej) => {
        void (async () => {
            const mid = uniqueHash(await getMachineUniqueID());
            const s = setTimeout(() => {
                ws.close();
                rej();
            }, 5000);
            ws.onmessage = (e) => {
                clearTimeout(s);
                try {
                    const r = String(e.data);
                    if (r.length !== 6) {
                        rej();
                    } else {
                        res(r);
                    }
                } catch {
                    rej();
                }
            };
            ws.onopen = () => {
                ws.send(
                    JSON.stringify({
                        type: "create",
                        ...info,
                        count: count,
                        expires: expires,
                        secret: mid
                    })
                );
            };
        })();
    });
}
