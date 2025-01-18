import EventEmitter from "events";
import { nanoid } from "nanoid";

export class WebSocketJsonRpcClient {
    // This implementation uses third-party WebSocket implementation
    // Migrate to Node.js native WebSocket when Electron supports Node.js 22.x
    private ws: WebSocket;

    // Map from request ID to the promise callbacks.
    private promiseMap = new Map<string, [(res: any) => void, (e: any) => void]>();

    private emitter = new EventEmitter();

    constructor(ws: WebSocket) {
        this.ws = ws;

        this.ws.addEventListener("error", (e) => {
            console.error(`Error in WebSocket JSON-RPC client`);
            console.error(e);
        });

        this.ws.onmessage = (e) => {
            const d = JSON.parse(e.data.toString());

            if (d.id) {
                // Handles response
                const p = this.promiseMap.get(d.id);
                if (!p) return;

                this.promiseMap.delete(d.id);
                const [res, rej] = p;

                if (d.error) rej(d.error);
                else res(d.result);
            } else {
                // Dispatches event
                const { method, params: [event] } = d;
                this.emitter.emit(method, event);
            }
        };
    }

    wait(): Promise<void> {
        return new Promise<void>((res, rej) => {
            this.ws.onopen = () => {
                this.ws.onerror = null;
                res();
            };

            this.ws.onerror = (e) => rej(e);
        });
    }

    on(channel: string, cb: (res: any) => void) {
        this.emitter.on(channel, cb);
    }

    async request(method: string, params: unknown[] = []): Promise<any> {
        const id = nanoid();

        const body = JSON.stringify({
            jsonrpc: "2.0",
            id, method, params
        });

        return new Promise((res, rej) => {
            this.promiseMap.set(id, [res, rej]);
            this.ws.send(body);
        });
    }
}