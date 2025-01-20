import { Container, type ContainerSpec } from "@/main/container/spec";
import { MavenName } from "@/main/profile/maven-name";
import { reg } from "@/main/registry/registry";
import path from "path";

let cachedContainers = new Map<string, Container>();

function get(id: string): Container {
    return hydrate(reg.containers.get(id));
}

function create(spec: ContainerSpec): Container {
    return new SimpleContainer(spec);
}

function hydrate(spec: ContainerSpec): Container {
    let cc = cachedContainers.get(spec.id);

    if (!cc) {
        cc = create(spec);
        cachedContainers.set(spec.id, cc);
    }

    return cc;
}

class SimpleContainer implements Container {
    spec;

    constructor(spec: ContainerSpec) {
        this.spec = spec;
    }

    asset(hash: string): string {
        return this.resolve("assets", "objects", hash.slice(0, 2), hash);
    }

    assetIndex(id: string): string {
        return this.resolve("assets", "indexes", `${id}.json`);
    }

    assetLegacy(id: string, name: string): string {
        return this.resolve("assets", "legacy", id, name);
    }

    assetMapped(name: string): string {
        return this.resolve("resources", name);
    }

    assetsRoot(): string {
        return this.resolve("assets");
    }

    client(id: string): string {
        return this.resolve("versions", id, `${id}.jar`);
    }

    gameDir(): string {
        return this.resolve(".");
    }

    librariesRoot(): string {
        return this.resolve("libraries");
    }

    library(name: string): string {
        return this.resolve("libraries", new MavenName(name).toPath());
    }

    nativeLibrary(libName: string, nativeName: string): string {
        const n = new MavenName(libName);
        n.classifier = nativeName;
        return this.resolve("libraries", n.toPath());
    }

    nativesRoot(id: string): string {
        return this.resolve(".natives", id);
    }

    profile(id: string): string {
        return this.resolve("versions", id, `${id}.json`);
    }

    assetsRootLegacy(id: string): string {
        return this.resolve("assets", "legacy", id);
    }

    assetsRootMapped(): string {
        return this.resolve("resources");
    }

    loggingConfig(id: string): string {
        return this.resolve(id);
    }

    private resolve(...rel: string[]): string {
        return path.normalize(path.resolve(this.spec.root, ...rel));
    }
}

export const containers = {
    create, get
};
