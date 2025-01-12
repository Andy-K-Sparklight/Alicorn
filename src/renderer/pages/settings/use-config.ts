import type { UserConfig } from "@/main/conf/conf";
import { createContext, useContext } from "react";

export interface ConfigContextContent {
    config: UserConfig;
    setConfig: (config: UserConfig) => void;
}

export const ConfigContext = createContext<ConfigContextContent | null>(null);

/**
 * Hook for retrieving and updating user config.
 *
 * Returns an array of 2 elements. The first is the config object. The second is a function that accepts a reducer
 * (combines config and the given value) and generates change handler for the specified value type.
 */
export function useConfig(): [UserConfig | null, <T>(reducer: (c: UserConfig, v: T) => void) => (v: T) => void] {
    const ctx = useContext(ConfigContext);

    if (!ctx) return [null, () => () => {}];

    const { config, setConfig } = ctx;

    function makeReduce<T>(reducer: (c: UserConfig, v: T) => void): (v: T) => void {
        return (v) => {
            const c = structuredClone(config);
            reducer(c, v);
            setConfig(c);
        };
    }

    return [config, makeReduce];
}