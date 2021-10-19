import CryptoJS from "crypto-js";
import { ipcRenderer } from "electron";
import { CODE_32_SPECIAL } from "../commons/Constants";
import { getMachineUniqueID } from "./Unique";

let MACHINE_ID_32: string;

export async function initEncrypt(): Promise<void> {
  MACHINE_ID_32 = (await getMachineUniqueID()).slice(0, 32);
}

export function getUniqueID32(): string {
  return MACHINE_ID_32 || CODE_32_SPECIAL;
}

export function decryptByMachine(data: string): string {
  if (data === "") {
    return "";
  }
  try {
    return CryptoJS.AES.decrypt(data, MACHINE_ID_32).toString(
      CryptoJS.enc.Utf8
    );
  } catch {
    return "";
  }
}

export function decryptObject(objSrc: string): unknown {
  try {
    return JSON.parse(decryptByMachine(objSrc));
  } catch {
    return {};
  }
}

export function encrypt2(src: string): string {
  if (src === "") {
    return "";
  }
  try {
    return ipcRenderer.sendSync("encryptSync", src);
  } catch {
    return "";
  }
}

export function decrypt2(src: string): string {
  if (src === "") {
    return "";
  }
  try {
    return ipcRenderer.sendSync("decryptSync", src);
  } catch {
    return "";
  }
}
