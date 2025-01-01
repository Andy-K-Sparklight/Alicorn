import type { BuildDefines } from "~/defines";

declare global {
    interface ImportMetaEnv extends BuildDefines {}
}


export {};