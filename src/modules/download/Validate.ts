import CryptoJS from "crypto-js";
import { readFile } from "fs-extra";
import sha from "sha";
export function validate(file: string, expected: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    sha.check(file, expected, (e) => {
      if (e) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export function getHash(f: string): Promise<string> {
  return new Promise<string>((resolve) => {
    sha.get(f, (e, d) => {
      if (e) {
        resolve("");
      } else {
        resolve(d);
      }
    });
  });
}

export async function getIdentifier(f: string): Promise<string> {
  try {
    const bf = (await readFile(f)).toString();
    const r1 = CryptoJS.SHA512(bf.toString()).toString();
    const r2 = CryptoJS.SHA256(bf.toString()).toString();
    console.log(r1 + "-" + r2);
    return r1 + "-" + r2;
  } catch (e) {
    console.log(e);
    return "";
  }
}
