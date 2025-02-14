import { safeStorage } from "electron";

export function doEncrypt(src: string): string {
    if (!safeStorage.isEncryptionAvailable()) {
        return src;
    }

    return safeStorage.encryptString(src).toString("base64");
}

export function doDecrypt(buf: string): string {
    if (!safeStorage.isEncryptionAvailable()) {
        return buf;
    }

    return safeStorage.decryptString(Buffer.from(buf, "base64"));
}
