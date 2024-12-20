/**
 * Alicorn provides multiple container types for different path resolution strategy.
 */
export enum ContainerType {
    /**
     * All files are statically allocated in the container. Similar to the vanilla game structure.
     */
    STATIC = "static",

    /**
     * Immutable files are allocated in the store area and can be reused. Paths are redirected at runtime.
     *
     * Not compatible with Forge or third-party clients relying on certain structure.
     */
    SHARED = "shared",

    /**
     * Immutable files are hard-linked. No path redirection needed.
     *
     * A trade-off between compatibility and performance. Remains compatibility with most clients, yet the files are
     * prone to modifications and must be placed on the same filesystem with the containers.
     */
    LINKED = "linked"
}

/**
 * Containers are abstractions for managing game files.
 */
export interface Container {
    /**
     * Container ID.
     */
    id: string;

    /**
     * Container filesystem type.
     */
    type: ContainerType;

    /**
     * Gets the path to the asset object.
     * @param hash Asset object hash.
     */
    asset(hash: string): string;

    /**
     * Gets the path to the asset object for the legacy name-based asset scheme.
     * @param id The ID of the asset index.
     * @param name Asset object name.
     */
    assetLegacy(id: string, name: string): string;

    /**
     * Gets the path to the asset object for the legacy resource-mapped asset scheme.
     * @param name Asset object name.
     */
    assetMapped(name: string): string;

    /**
     * Gets the path to the assets root directory.
     */
    assetsRoot(): string;

    /**
     * Gets the path to the legacy assets root directory.
     *
     * @param id Asset index ID.
     */
    assetsRootLegacy(id: string): string;

    /**
     * Gets the path to the mapped assets root directory.
     */
    assetsRootMapped(): string;

    /**
     * Gets the path where the asset index is stored.
     * @param id Asset index ID.
     */
    assetIndex(id: string): string;

    /**
     * Gets the game directory.
     */
    gameDir(): string;

    /**
     * Gets the path to the library.
     * @param name Library name.
     */
    library(name: string): string;

    /**
     * Gets the path to the profile document.
     * @param id Profile ID.
     */
    profile(id: string): string;

    /**
     * Gets the path to the client jar location.
     * @param id Profile ID.
     */
    client(id: string): string;

    /**
     * Gets the path to the libraries root directory.
     */
    librariesRoot(): string;

    /**
     * Gets the path to the unpacked native libraries.
     * @param id Profile ID.
     */
    nativesRoot(id: string): string;

    /**
     * Gets the path to the logging configuration file.
     * @param id Logger ID.
     */
    loggingConfig(id: string): string;
}