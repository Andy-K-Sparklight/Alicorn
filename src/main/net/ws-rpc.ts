import Emittery from "emittery";
import { nanoid } from "nanoid";
import { pEvent } from "p-event";

export class WebSocketJsonRpcClient {
    // This implementation uses third-party WebSocket implementation
    // Migrate to Node.js native WebSocket when Electron supports Node.js 22.x
    #ws: WebSocket;

    // Map from request ID to callbacks.
    #callbacks = new Map<string, (e: any, res: any) => void>();

    #emitter = new Emittery();

    constructor(ws: WebSocket) {
        this.#ws = ws;

        this.#ws.addEventListener("error", (e) => {
            console.error(`Error in WebSocket JSON-RPC client`);
            console.error(e);
        });

        this.#ws.onmessage = (e) => {
            const d = JSON.parse(e.data.toString());

            if (d.id) {
                // Handles response
                const cb = this.#callbacks.get(d.id);
                if (!cb) return;

                this.#callbacks.delete(d.id);

                cb(d.error, d.result);
            } else {
                // Dispatches event
                const { method, params: [event] } = d;
                void this.#emitter.emit(method, event);
            }
        };
    }

    async wait(): Promise<void> {
        await pEvent(this.#ws, "open");
    }

    on(channel: string, cb: (res: any) => void) {
        this.#emitter.on(channel, cb);
    }

    async request(method: string, params: unknown[] = []): Promise<any> {
        const id = nanoid();

        const body = JSON.stringify({
            jsonrpc: "2.0",
            id, method, params
        });

        this.#ws.send(body);

        const { promise, resolve, reject } = Promise.withResolvers<any>();

        this.#callbacks.set(id, (e, d) => {
            if (e) reject(e);
            else resolve(d);
        });

        return promise;
    }
}
