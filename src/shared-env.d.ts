import type { BuildDefines } from "~/build-src/defines";

declare global {
    interface ImportMetaEnv extends BuildDefines {}
}


export {};
