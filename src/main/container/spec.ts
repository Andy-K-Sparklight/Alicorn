import type { RegistryTransformer } from "@/main/registry/registry";

/**
 * Minimum required information to construct a container.
 */
export interface ContainerProps {
    id: string;
    root: string;
    flags: Partial<ContainerFlags>;
}

/**
 * Flags for describing management strategies of the container.
 */
export interface ContainerFlags {
    /**
     * Whether to link immutable files to reduce space consumption.
     */
    link: boolean;
}

/**
 * Containers are abstractions for managing game files.
 */
export interface Container {
    props: ContainerProps;

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
     * Resolve game contents. e.g. resource packs, shader packs, mods, etc..
     */
    content(scope: string): string;

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
     * Gets the path to the native library.
     * @param libName Library name.
     * @param nativeName Library native artifact name.
     */
    nativeLibrary(libName: string, nativeName: string): string;

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

    /**
     * Gets the path to the options file.
     */
    options(): string;

    /**
     * Gets the path to the `launcher_profiles.json` file.
     */
    launcherProfiles(): string;

    /**
     * Gets the path to an addon.
     */
    addon(scope: string, name: string): string;

    /**
     * Gets the path to the MPM lockfile.
     */
    mpmLockfile(): string;
}

export const CONTAINER_REG_VERSION = 0;
export const CONTAINER_REG_TRANS: RegistryTransformer[] = [];
