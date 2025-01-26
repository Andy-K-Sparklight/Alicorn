import type { LaunchHint } from "@/main/launch/types";

export interface GameProfile {
    /**
     * Game identifier.
     */
    id: string;

    /**
     * User-defined name.
     */
    name: string;

    /**
     * Time last accessed.
     */
    time: number;

    /**
     * Whether the game has been installed.
     */
    installed: boolean;

    /**
     * Launch hint object.
     */
    launchHint: LaunchHint;
}

export interface GameSummary {
    id: string;
    name: string;
    versionId: string;
    gameVersion: string;
    installed: boolean;
    isModded: boolean;
    modLoader: string;
}
