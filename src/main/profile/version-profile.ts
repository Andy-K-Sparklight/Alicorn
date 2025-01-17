/**
 * The new profile module, defined types used in the profile.
 *
 * This module is rewritten in the hope that it optimizes the profile parsing process and reduces overhead.
 * In particular, it uses more type-based definitions comparing to the legacy implementation of Alicorn.
 */
import type { OSName } from "@/main/sys/os";

/**
 * Game version profile. Contains information for managing resources and spawning game process.
 */
export interface VersionProfile {
    id: string;

    /**
     * A non-standard runtime-only property defining the base version of the profile.
     */
    version: string;

    arguments: {
        game: Argument[],
        jvm: Argument[]
    };

    assetIndex: AssetIndexArtifact;
    assets: string;

    complianceLevel: number;

    inheritsFrom?: string;

    downloads: {
        /**
         * Defines the client download source.
         */
        client: DownloadsArtifact,

        /**
         * Defines mappings used by the client.
         *
         * This key is missing in some early versions.
         */
        client_mappings?: DownloadsArtifact
    };

    /**
     * Defines JRT version used by the profile.
     *
     * This key is missing in some early versions.
     */
    javaVersion?: JRTVersionPrompt;

    libraries: Library[];

    logging?: {
        client: {
            argument: string;
            file: LoggingArtifact;
        }
    };

    mainClass: string;

    type: string;
}

/**
 * Defines arguments that are only applied when certain rules are met.
 */
export interface ConditionalArgument {
    value: string | string[];
    rules: Rule[];
}

/**
 * Defines a rule entry to describe certain criterion.
 */
export interface Rule {
    action: "allow" | "disallow",
    features?: Record<string, boolean>,
    os?: {
        name?: OSName,
        version?: string,
        arch?: string
    }
}

/**
 * Defines a generic argument in the profile.
 */
export type Argument = string | ConditionalArgument

export interface AssetIndexArtifact {
    id: string;
    sha1: string;
    size: number;
    totalSize: number;
    url: string;
}

/**
 * Defines artifacts used in the download sources of client / server and their mappings.
 */
export interface DownloadsArtifact {
    sha1: string;
    size: number;
    url: string;
}

export interface JRTVersionPrompt {
    component: string;
    majorVersion: number;
}

export interface Library {
    downloads?: {
        artifact?: LibraryArtifact;
        classifiers?: Record<string, LibraryArtifact>;
    };

    name: string;
    natives?: Partial<Record<OSName, string>>;
    rules?: Rule[];
    extract?: {
        /**
         * A pattern to be excluded when extracting native libraries.
         */
        exclude?: string[];
    };

    url?: string;
    sha1?: string;
}

export interface LibraryArtifact {
    path?: string;
    sha1?: string;
    size?: number;
    url?: string;
}

export interface LoggingArtifact {
    id: string;
    sha1: string;
    size: number;
    url: string;
}

