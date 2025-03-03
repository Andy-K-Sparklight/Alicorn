import { Container, type ContainerProps } from "@/main/container/spec";
import { MavenName } from "@/main/profile/maven-name";
import { reg } from "@/main/registry/registry";
import path from "node:path";


function get(id: string): Container {
    return create(structuredClone(reg.containers.get(id)));
}

function create(props: ContainerProps): Container {
    return new SimpleContainer(props);
}

function add(c: Container | ContainerProps) {
    if ("props" in c) {
        reg.containers.add(c.props.id, c.props);
    } else {
        reg.containers.add(c.id, c);
    }
}


class SimpleContainer implements Container {
    props;

    constructor(spec: ContainerProps) {
        this.props = spec;
    }

    asset(hash: string): string {
        return this.#resolve("assets", "objects", hash.slice(0, 2), hash);
    }

    assetIndex(id: string): string {
        return this.#resolve("assets", "indexes", `${id}.json`);
    }

    assetLegacy(id: string, name: string): string {
        return this.#resolve("assets", "legacy", id, name);
    }

    assetMapped(name: string): string {
        return this.#resolve("resources", name);
    }

    assetsRoot(): string {
        return this.#resolve("assets");
    }

    content(scope: string): string {
        return this.#resolve(scope);
    }

    client(id: string): string {
        return this.#resolve("versions", id, `${id}.jar`);
    }

    gameDir(): string {
        return this.#resolve(".");
    }

    librariesRoot(): string {
        return this.#resolve("libraries");
    }

    library(name: string): string {
        return this.#resolve("libraries", new MavenName(name).toPath());
    }

    nativeLibrary(libName: string, nativeName: string): string {
        const n = new MavenName(libName);
        n.classifier = nativeName;
        return this.#resolve("libraries", n.toPath());
    }

    nativesRoot(id: string): string {
        return this.#resolve(".natives", id);
    }

    profile(id: string): string {
        return this.#resolve("versions", id, `${id}.json`);
    }

    assetsRootLegacy(id: string): string {
        return this.#resolve("assets", "legacy", id);
    }

    assetsRootMapped(): string {
        return this.#resolve("resources");
    }

    loggingConfig(id: string): string {
        return this.#resolve(id);
    }

    options(): string {
        return this.#resolve("options.txt");
    }

    launcherProfiles(): string {
        return this.#resolve("launcher_profiles.json");
    }

    #resolve(...rel: string[]): string {
        return path.normalize(path.resolve(this.props.root, ...rel));
    }
}

export const containers = {
    create, get, add
};
