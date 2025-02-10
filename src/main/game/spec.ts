import type { LaunchHint } from "@/main/launch/types";
import type { RegistryTransformer } from "@/main/registry/registry";

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
     * Props for installing the game.
     */
    installProps: {
        // TODO add other types when supporting mod loader
        type: "vanilla";
    };

    /**
     * Game related versions.
     */
    versions: { game: string } & Record<string, string>;

    /**
     * Assets level for downloading partial assets.
     */
    assetsLevel: "full" | "video-only";

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

export const GAME_REG_VERSION = 1;
export const GAME_REG_TRANS: RegistryTransformer[] = [
    // v1: patch the `installerProps` key
    (s) => {
        s.installProps = {
            type: "vanilla"
        };

        return s;
    }
];
