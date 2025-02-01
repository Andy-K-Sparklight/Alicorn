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
     * Virtual properties for uncreated games.
     */
    virtual: VirtualProperties;

    /**
     * Launch hint object.
     */
    launchHint: LaunchHint;
}

interface VirtualProperties {
    baseVersion: string;
    modLoader: string; // Empty string indicates no mod loader (vanilla)
    type: string;
}

/**
 * Detailed game profile to be used in the frontend.
 */
export interface GameProfileDetail {
    id: string;
    name: string;
    versionId: string;
    gameVersion: string;
    installed: boolean;
    modLoader: string;
    stable: boolean;
}
