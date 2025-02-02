/**
 * The global type of any message dispatched on the window object.
 *
 * All messages sent over the window object must implement this interface to avoid possible interference.
 */
export interface WindowMessageContent<T = never> {
    channel: string;
    detail?: T;
}
