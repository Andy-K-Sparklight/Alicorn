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
    time: string;

    /**
     * Whether the game has been installed.
     */
    installed: boolean;

    /**
     * ID used for launch configuration.
     */
    launchHintId: string;
}
