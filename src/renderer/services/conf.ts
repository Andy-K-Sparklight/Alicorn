import type { UserConfig } from "@/main/conf/conf";
import { alter } from "@/main/util/misc";
import { confSlice } from "@/renderer/store/conf";
import { globalStore, useAppSelector } from "@/renderer/store/store";

native.conf.onChange(handleChange);
native.conf.get().then(handleChange);

function handleChange(c: UserConfig) {
    globalStore.dispatch(
        confSlice.actions.replace({ config: c })
    );
}

export function useConfig() {
    const config = useAppSelector(s => s.conf.config);

    function alterConfig(update: (c: UserConfig) => void) {
        if (!config) return;

        native.conf.update(alter(config, update));
    }

    return { config, alterConfig };
}
