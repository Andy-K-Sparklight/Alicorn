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
     * Game related versions.
     */
    versions: { game: string } & Record<string, string>;

    /**
     * Launch hint object.
     */
    launchHint: LaunchHint;

    /**
     * Type of the game core.
     */
    type: GameCoreType;
}

export type GameCoreType =
    "vanilla-snapshot" |
    "vanilla-release" |
    "vanilla-old-alpha" |
    "vanilla-old-beta" |
    "forge" |
    "fabric" |
    "quilt" |
    "neoforged" |
    "unknown"
