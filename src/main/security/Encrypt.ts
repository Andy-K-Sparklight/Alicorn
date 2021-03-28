import CryptoJS from "crypto-js";
import { getMachineUniqueID } from "./Unique";

let MACHINE_ID_32: string;

export async function initEncrypt(): Promise<void> {
  MACHINE_ID_32 = (await getMachineUniqueID()).slice(0, 32);
}

export function encryptByMachine(data: string): string {
  return CryptoJS.AES.encrypt(data, MACHINE_ID_32).toString();
}

export function decryptByMachine(data: string): string {
  return CryptoJS.AES.decrypt(data, MACHINE_ID_32).toString(CryptoJS.enc.Utf8);
}
