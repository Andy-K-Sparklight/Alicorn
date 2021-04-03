import CryptoJS from "crypto-js";
import { getMachineUniqueID } from "./Unique";
import { CODE_32_SPECIAL } from "../commons/Constants";

let MACHINE_ID_32: string;

export async function initEncrypt(): Promise<void> {
  MACHINE_ID_32 = (await getMachineUniqueID()).slice(0, 32);
}

export function getUniqueID32(): string {
  return MACHINE_ID_32 || CODE_32_SPECIAL;
}

export function encryptByMachine(data: string): string {
  return CryptoJS.AES.encrypt(data, MACHINE_ID_32).toString();
}

export function decryptByMachine(data: string): string {
  return CryptoJS.AES.decrypt(data, MACHINE_ID_32).toString(CryptoJS.enc.Utf8);
}

export function encryptObject(obj: unknown): string {
  return encryptByMachine(JSON.stringify(obj));
}

export function decryptObject(objSrc: string): unknown {
  try {
    return JSON.parse(decryptByMachine(objSrc));
  } catch {
    return {};
  }
}
