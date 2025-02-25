import { isTruthy } from "@/main/util/misc";

/**
 * Parses a library name of Maven standard.
 */
export class MavenName {
    group: string;
    artifact: string;
    version: string;
    classifier: string;
    ext: string;

    constructor(name: string) {
        const [main, ext] = name.split("@");
        const [group, artifact, version, classifier] = main.split(":");
        if (!group || !artifact || !version) throw `Invalid Maven library name: ${name}`;
        this.group = group;
        this.artifact = artifact;
        this.version = version;
        this.classifier = classifier || "";
        this.ext = ext || "jar";
    }

    /**
     * Converts the Maven name to a path seperated by slashes (/).
     */
    toPath(): string {
        const groupPath = this.group.replaceAll(".", "/");
        const jarName = [this.artifact, this.version, this.classifier].filter(isTruthy).join("-") + "." + this.ext;

        return [groupPath, this.artifact, this.version, jarName].join("/");
    }
}
