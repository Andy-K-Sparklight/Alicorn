import { type NativeAPI } from "./preload";

declare global {
    const native: NativeAPI;
}