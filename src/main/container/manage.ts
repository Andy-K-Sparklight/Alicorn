import { Container } from "@/main/container/spec";
import { NamedRegistry, registry } from "@/main/registry/registry";
import { StaticContainer } from "@/main/container/static";

let ent: NamedRegistry<Container>;

async function load() {
    if (!ent) {
        ent = await registry.loadNamed("containers", { StaticContainer });
    }
}

function entries() {
    return ent;
}


export const containers = {
    load, entries
};

