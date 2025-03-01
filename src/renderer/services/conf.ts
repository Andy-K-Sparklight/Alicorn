import type { UserConfig } from "@/main/conf/conf";
import { alter } from "@/main/util/misc";
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

        native.conf.update(alter(config, update));
    }

    return { config, alterConfig };
}
