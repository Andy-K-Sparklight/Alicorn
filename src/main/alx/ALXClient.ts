import { nanoid } from "nanoid";

/**
 * ALX is a protocol allowing Alicorn to communicate with a probe inside the game.
 * ALX server is implemented at the Java side. This is the client part.
 */
export class ALXClient {
    #ws: WebSocket;
    #resolvers = new Map<string, (r: string) => void>();
    #error: unknown = null;
    #nonce: string;
    #readyPromise: Promise<void>;

    constructor(addr: string, nonce: string) {
        this.#ws = new WebSocket(addr);
        this.#nonce = nonce;

        const { promise, resolve, reject } = Promise.withResolvers<void>();
        this.#readyPromise = promise;

        this.#ws.addEventListener("open", () => resolve(), { once: true });
        this.#ws.addEventListener("error", () => reject(), { once: true });
        this.#ws.addEventListener("close", () => reject(), { once: true });

        this.#ws.addEventListener("message", e => {
            const data = e.data.toString();
            const { eid, res } = JSON.parse(data);
            this.#resolvers.get(eid)?.(res);
            this.#resolvers.delete(eid);
        });
    }

    ready(): Promise<void> {
        return this.#readyPromise;
    }

    /**
     * Gets memory usage in bytes.
     */
    async getMemoryUsage(): Promise<number> {
        const res = await this.#request("getMemoryUsage");
        return parseInt(res, 10);
    }

    /**
     * Checks if the server is alive.
     */
    async isAlive(): Promise<boolean> {
        if (this.#error !== null) return false;

        const { promise, resolve } = Promise.withResolvers<string>();
        const timeout = setTimeout(() => resolve(""), 3000);

        const res = await Promise.any([this.#request("isAlive"), promise]);
        clearTimeout(timeout);

        return res === "OK";
    }

    #request(method: string, ...params: any[]): Promise<any> {
        const eid = nanoid();
        const body = JSON.stringify({ nonce: this.#nonce, eid, method, params });
        const { promise, resolve } = Promise.withResolvers<string>();
        this.#resolvers.set(eid, resolve);
        this.#ws.send(body);
        return promise;
    }

    close() {
        this.#ws.close();
    }
}
