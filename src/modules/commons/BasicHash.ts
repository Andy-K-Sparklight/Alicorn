import CryptoJS from "crypto-js";
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
