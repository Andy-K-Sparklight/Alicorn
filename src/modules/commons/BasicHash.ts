import CryptoJS from "crypto-js";
import { invokeWorker } from "../../renderer/Schedule";

export function basicHash(
    obj: string | number | Record<string, unknown>
): string {
    return CryptoJS.SHA1(obj.toString()).toString();
}

export function uniqueHash(
    obj: string | number | Record<string, unknown>
): string {
    return CryptoJS.SHA256(obj.toString()).toString();
}

export async function abortableBasicHash(
    obj: string | number | Record<string, unknown>
): Promise<string> {
    return String(await invokeWorker("SHA1", obj));
}

export async function abortableUniqueHash(
    obj: string | number | Record<string, unknown>
): Promise<string> {
    return String(await invokeWorker("SHA256", obj));
}
