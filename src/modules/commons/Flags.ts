import { ALICORN_SEPARATOR } from "./Constants";

const PERM_FLAGS: Set<string> = new Set(
  localStorage.getItem("Alicorn.Flags")?.split(ALICORN_SEPARATOR)
);
const TEMP_FLAGS: Set<string> = new Set();
export function setFlag(name: string | Flags, temp = false): void {
  if (!temp) {
    PERM_FLAGS.add(name.toString());
    localStorage.setItem(
      "Alicorn.Flags",
      Array.from(PERM_FLAGS).join(ALICORN_SEPARATOR)
    );
  } else {
    TEMP_FLAGS.add(name.toString());
  }
}

export function hasFlag(name: string | Flags): boolean {
  return PERM_FLAGS.has(name.toString()) || TEMP_FLAGS.has(name.toString());
}

export function clearFlag(name: string | Flags): void {
  PERM_FLAGS.delete(name.toString());
  localStorage.setItem(
    "Alicorn.Flags",
    Array.from(PERM_FLAGS).join(ALICORN_SEPARATOR)
  );
  TEMP_FLAGS.delete(name.toString());
}

export enum Flags {
  ENABLE_LOCAL_SKIN,
}
