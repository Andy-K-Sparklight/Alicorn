import { AuthCredentials } from "@/main/auth/types";
import { Container } from "@/main/container/spec";
import { VersionProfile } from "@/main/profile/version-profile";

/**
 * Launch hints are the next generation way of managing the launch process.
 * User is capable for customizing the detailed launch options without creating new containers or create additional files.
 */
export interface LaunchHint {
    containerId: string;
    profileId: string;

    /**
     * Account identifier. An empty string indicates a new account should be created when launching.
     */
    accountId: string;
    pref: Partial<LaunchPref>;

    /**
     * Whether the profile should be run in virtual environment.
     */
    venv?: boolean;
}

/**
 * Launch preferences defined by the user.
 */
export interface LaunchPref {
    /**
     * Memory limitations.
     *
     * A value between 0.0 and 1.0 is seen as a percentage of the available memory.
     * Values higher are interpreted as MiBs.
     */
    memory: {
        min: number;
        max: number;
    };

    /**
     * Window size configuration.
     */
    window: {
        width: number;
        height: number;
    };

    /**
     * Per-hint additional arguments.
     */
    args: {
        vm: string[];
        game: string[];
    };

    /**
     * Alternative JRT executable.
     */
    alterJRTExec: string;
}

export interface LaunchInit {
    profile: VersionProfile;
    container: Container;
    jrtExec: string;
    credentials: AuthCredentials;
    enabledFeatures: Set<string>;
    assetsShouldMap: boolean;
    pref: Partial<LaunchPref>;
    extraVMArgs?: string[];
    extraClasspath?: string[];
    altMainClass?: string;
}
