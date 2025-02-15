import type { UserConfig } from "@/main/conf/conf";
import Emittery from "emittery";
import { useSyncExternalStore } from "react";

native.conf.onChange(handleChange);
native.conf.get().then(handleChange);

let remoteConfig: UserConfig | null = null;

function handleChange(c: UserConfig) {
    remoteConfig = c;
    void emitter.emit("change");
}

const emitter = new Emittery();

function getSnapshot() {
    return remoteConfig;
}

function subscribe(onChange: () => void) {
    emitter.on("change", onChange);
    return () => emitter.off("change", onChange);
}

export function useConfig() {
    const config = useSyncExternalStore(subscribe, getSnapshot);

    function alterConfig(update: (c: UserConfig) => void) {
        if (!config) return;

        const src = structuredClone(config);
        update(src);
        native.conf.update(src);
    }

    return { config, alterConfig };
}
