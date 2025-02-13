import type { UserConfig } from "@/main/conf/conf";
import React, { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";

export interface ConfigContextContent {
    config: UserConfig;
    setConfig: (config: UserConfig) => void;
}

export const ConfigContext = createContext<ConfigContextContent | null>(null);

export function ConfigProvider({ children }: PropsWithChildren) {
    const [cfg, setCfg] = useState<UserConfig>();

    useEffect(() => {
        native.conf.get().then(setCfg);
    }, []);

    if (!cfg) return;

    const context: ConfigContextContent = {
        config: cfg,
        setConfig(c) {
            void native.conf.update(c);
            setCfg(c);
        }
    };

    return <ConfigContext.Provider value={context}>
        {children}
    </ConfigContext.Provider>;
}

/**
 * Hook for retrieving and updating user config.
 *
 * Returns an array of 2 elements. The first is the config object. The second is a function that accepts a reducer
 * (combines config and the given value) and generates change handler for the specified value type.
 */
export function useConfig(): [UserConfig, <T>(reducer: (c: UserConfig, v: T) => void) => (v: T) => void] {
    const ctx = useContext(ConfigContext);

    if (!ctx) throw "Should not access config object outside the provider";

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
