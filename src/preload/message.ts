import { pEvent } from "p-event";

/**
 * The global type of any message dispatched on the window object.
 *
 * All messages sent over the window object must implement this interface to avoid possible interference.
 */
export interface WindowMessageContent<T = never> {
    channel: string;
    detail?: T;
}

/**
 * Retrieves a port sent from the isolated world.
 */
export async function retrievePort(nonce: string): Promise<MessagePort> {
    const pe = await pEvent(window, "message", {
        rejectionEvents: [],
        filter(e: MessageEvent<WindowMessageContent>) {
            return e.data.channel === `port:${nonce}`;
        }
    });

    return pe.ports[0];
}

/**
 * Sends a port to the main world.
 */
export function exposePort(nonce: string, port: MessagePort): void {
    window.postMessage({ channel: `port:${nonce}` } satisfies WindowMessageContent, "*", [port]);
}
