import { Container, ContainerType } from "@/main/container/spec";
import { MavenName } from "@/main/profile/maven-name";
import path from "path";

export class StaticContainer implements Container {
    id: string;
    type: ContainerType = ContainerType.STATIC;
    private readonly rootDir: string;

    constructor(id: string, rootDir: string) {
        this.id = id;
        this.rootDir = rootDir;
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
        return path.normalize(path.resolve(this.rootDir, ...rel));
    }
}

