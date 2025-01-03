import type { BuildDefines } from "~/scripts/defines";

declare global {
    interface ImportMetaEnv extends BuildDefines {}
}


export {};