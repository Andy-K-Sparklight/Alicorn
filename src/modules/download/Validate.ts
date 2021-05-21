import sha from "sha";
import { getBoolean } from "../config/ConfigSupport";

export function validate(file: string, expected: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (getBoolean("download.no-validate")) {
      return true;
    }
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
