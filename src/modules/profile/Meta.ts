import os from "os";
import { isNull, safeGet } from "../commons/Null";

export class OptionalArgument {
    rules: RuleSet;
    value: string[];

    constructor(rules: RuleSet, value: string[]) {
        this.rules = rules;
        this.value = value;
    }

    static fromString(str: string): OptionalArgument {
        return new OptionalArgument(RuleSet.emptyRuleSet(), [str]);
    }

    static fromObject(obj: Record<string, unknown>): OptionalArgument {
        const rs = RuleSet.fromArray(obj["rules"]);
        let values = [];
        if (obj["value"] instanceof Array) {
            values = obj["value"];
        }
        if (typeof obj["value"] === "string") {
            values = [obj["value"]];
        }
        return new OptionalArgument(rs, values);
    }

    clone(): OptionalArgument {
        return new OptionalArgument(this.rules.clone(), this.value.concat());
    }
}

export class ArtifactMeta {
    private static readonly EMPTY_INSTANCE = new ArtifactMeta("", "", "", 0);
    url: string;
    sha1: string;
    path: string;
    size: number;

    constructor(url: string, sha1: string, path: string, size: number) {
        this.url = url;
        this.sha1 = sha1;
        this.path = path;
        this.size = size;
    }

    static emptyArtifactMeta(): ArtifactMeta {
        return ArtifactMeta.EMPTY_INSTANCE;
    }

    static fromObject(obj: Record<string, unknown>): ArtifactMeta {
        if (isNull(obj)) {
            return ArtifactMeta.emptyArtifactMeta();
        }
        let sz = obj["size"] || 0;
        if (typeof sz !== "number") {
            sz = parseInt(String(sz));
        }
        if (isNaN(sz as number)) {
            sz = 0;
        }
        return new ArtifactMeta(
            String(obj["url"]),
            String(obj["sha1"]),
            String(obj["path"] || obj["id"]),
            sz as number
        );
    }

    clone(): ArtifactMeta {
        return new ArtifactMeta(this.url, this.sha1, this.path, this.size);
    }
}

export class LibraryMeta {
    artifact: ArtifactMeta;
    classifiers: ClassifiersMeta;
    isNative: boolean;
    rules: RuleSet;
    name: string;

    constructor(
        artifact: ArtifactMeta,
        cf: ClassifiersMeta,
        isNative: boolean,
        rules: RuleSet,
        name: string
    ) {
        this.artifact = artifact;
        this.classifiers = cf;
        this.isNative = isNative;
        this.rules = rules;
        this.name = name;
    }

    static fromObject(obj: Record<string, unknown>): LibraryMeta {
        // We'll do this violently
        let isNative = false;
        let rules = RuleSet.emptyRuleSet();
        let artifact = ArtifactMeta.emptyArtifactMeta();
        let classifiers = ClassifiersMeta.emptyClassifiersMeta();
        // There should be 'downloads' key
        // We'll convert the profile of Forge/Fabric/OptiFine/Others before invoking this
        if (obj["downloads"]) {
            // Assume that 'downloads' must be object
            const downloads = obj["downloads"] as Record<string, unknown>;
            // Nonnull
            if (downloads["classifiers"]) {
                isNative = true;
                classifiers = ClassifiersMeta.fromObject(
                    // Forceful!
                    // I'm sorry, Twilight
                    downloads["classifiers"] as Record<string, unknown>
                );
            }
            if (downloads["artifact"]) {
                artifact = ArtifactMeta.fromObject(
                    // Let go!
                    downloads["artifact"] as Record<string, unknown>
                );
            }
        }
        // for (const n of ["natives-linux", "natives-windows", "natives-macos"]) {
        //     if (String(obj["name"]).includes(n)) {
        //         // Guess in 1.19
        //         isNative = true;
        //         classifiers = new ClassifiersMeta(
        //             ArtifactMeta.emptyArtifactMeta(),
        //             artifact, // Just set them to the same will be fine.
        //             artifact,
        //             artifact,
        //             ArtifactMeta.emptyArtifactMeta()
        //         );
        //         break;
        //     }
        // }

        if (obj["rules"] instanceof Array) {
            // Simply parse
            rules = RuleSet.fromArray(obj["rules"]);
        }
        return new LibraryMeta(
            artifact,
            classifiers,
            isNative,
            rules,
            String(obj["name"]) || ""
        );
    }

    clone(): LibraryMeta {
        return new LibraryMeta(
            this.artifact.clone(),
            this.classifiers.clone(),
            this.isNative,
            this.rules.clone(),
            this.name
        );
    }

    canApply(): boolean {
        return this.rules.judge();
    }
}

class RuleSet {
    private static readonly EMPTY_RULESET = new RuleSet();
    private readonly rules: Rule[] = [];

    constructor(rules?: Rule[]) {
        this.rules = rules || [];
    }

    static fromArray(obj: unknown): RuleSet {
        const tmpArr = [];
        if (obj instanceof Array) {
            for (const v of obj) {
                if (typeof v === "object") {
                    tmpArr.push(Rule.fromObject(v));
                }
            }
            return new RuleSet(tmpArr);
        }
        return RuleSet.EMPTY_RULESET;
    }

    static emptyRuleSet(): RuleSet {
        return RuleSet.EMPTY_RULESET;
    }

    clone(): RuleSet {
        return new RuleSet(
            this.rules.map((r) => {
                return r.clone();
            })
        );
    }

    judge(): boolean {
        let originState = false; // This MUST BE false
        if (this.rules.length === 0) {
            return true; // No rules means true
        }
        for (const r of this.rules) {
            if (r.shouldApply()) {
                originState = r.isAllow;
            }
        }
        return originState;
    }
}

// This is a fake one
// We don't (and can't) really judge those rules by parsing the JSON
// Mojang only uses 'os.name' 'os.version' and 'os.arch' so far, though
class Rule {
    private static readonly DO_NOTHING_RULE = new Rule(true);
    isAllow: boolean;
    requireOSType: string;
    requireOSVersion: string;
    requireOSArch: string;

    constructor(
        isAllow: boolean,
        osType?: string,
        osVer?: string,
        osArch?: string
    ) {
        this.isAllow = isAllow;
        this.requireOSType = osType || "";
        this.requireOSVersion = osVer || "";
        this.requireOSArch = osArch || "";
    }

    static nothingRule(): Rule {
        return Rule.DO_NOTHING_RULE;
    }

    static fromObject(obj: Record<string, unknown>): Rule {
        let action = true;
        let osName = "";
        let osVer = "";
        let osArch = "";
        if (obj["action"] === "disallow") {
            action = false;
        }
        if (obj["os"] !== undefined && obj["os"] !== null) {
            // I'm sorry ponies, but this is more convenient
            // @ts-ignore
            osName = obj["os"]["name"] || "";
            // @ts-ignore
            osVer = obj["os"]["version"] || "";
            // @ts-ignore
            osArch = obj["os"]["arch"] || "";
        }
        return new Rule(action, osName, osVer, osArch);
    }

    clone(): Rule {
        return new Rule(
            this.isAllow,
            this.requireOSType,
            this.requireOSVersion,
            this.requireOSArch
        );
    }

    shouldApply(): boolean {
        if (this.requireOSType !== "") {
            if (getCurrentOSNameAsMojang() !== this.requireOSType) {
                return false;
            }
        }
        if (this.requireOSArch !== "") {
            if (os.arch() !== this.requireOSArch) {
                return false;
            }
        }
        if (this.requireOSVersion !== "") {
            try {
                const versionRegex = new RegExp(this.requireOSVersion);
                if (!versionRegex.test(os.version())) {
                    return false;
                }
            } catch {
                return false;
            }
        }
        return true;
    }
}

export function getCurrentOSNameAsMojang(): string {
    const currentOSName = os.platform();
    switch (currentOSName) {
        case "win32":
            return "windows";
        case "darwin":
            return "osx";
        default:
            return "linux";
    }
}

export class ClassifiersMeta {
    private static readonly EMPTY_INSTANCE = new ClassifiersMeta(
        ArtifactMeta.emptyArtifactMeta(),
        ArtifactMeta.emptyArtifactMeta(),
        ArtifactMeta.emptyArtifactMeta(),
        ArtifactMeta.emptyArtifactMeta(),
        ArtifactMeta.emptyArtifactMeta()
    );
    javadoc: ArtifactMeta;
    nativesLinux: ArtifactMeta;
    nativesMacOS: ArtifactMeta;
    nativesWindows: ArtifactMeta;
    sources: ArtifactMeta;

    constructor(
        jd: ArtifactMeta,
        nLinux: ArtifactMeta,
        nMacOS: ArtifactMeta,
        nWin: ArtifactMeta,
        src: ArtifactMeta
    ) {
        this.javadoc = jd;
        this.nativesLinux = nLinux;
        this.nativesMacOS = nMacOS;
        this.nativesWindows = nWin;
        this.sources = src;
    }

    static emptyClassifiersMeta(): ClassifiersMeta {
        return ClassifiersMeta.EMPTY_INSTANCE;
    }

    static fromObject(obj: Record<string, unknown>): ClassifiersMeta {
        // No solution for thus type check
        // {} -> Record<string, unknown>
        // We'll just stick our necks out
        // Give it a try
        const javadoc =
            obj["javadoc"] === undefined || obj["javadoc"] === null
                ? ArtifactMeta.emptyArtifactMeta()
                : // @ts-ignore
                ArtifactMeta.fromObject(obj["javadoc"]);
        const nL =
            obj["natives-linux"] === undefined || obj["natives-linux"] === null
                ? ArtifactMeta.emptyArtifactMeta()
                : // @ts-ignore
                ArtifactMeta.fromObject(obj["natives-linux"]);
        const nM =
            obj["natives-macos"] === undefined || obj["natives-macos"] === null
                ? ArtifactMeta.emptyArtifactMeta()
                : // @ts-ignore
                ArtifactMeta.fromObject(obj["natives-macos"]);
        const nW =
            obj["natives-windows"] === undefined || obj["natives-windows"] === null
                ? ArtifactMeta.emptyArtifactMeta()
                : // @ts-ignore
                ArtifactMeta.fromObject(obj["natives-windows"]);
        const sources =
            obj["sources"] === undefined || obj["sources"] === null
                ? ArtifactMeta.emptyArtifactMeta()
                : // @ts-ignore
                ArtifactMeta.fromObject(obj["sources"]);

        return new ClassifiersMeta(javadoc, nL, nM, nW, sources);
    }

    clone(): ClassifiersMeta {
        return new ClassifiersMeta(
            this.javadoc.clone(),
            this.nativesLinux.clone(),
            this.nativesMacOS.clone(),
            this.nativesWindows.clone(),
            this.sources.clone()
        );
    }
}

export class AssetIndexArtifactMeta {
    private static readonly EMPTY_INSTANCE = new AssetIndexArtifactMeta(
        "",
        "",
        0,
        0,
        ""
    );
    id: string;
    sha1: string;
    size: number;
    totalSize: number;
    url: string;

    constructor(
        id: string,
        sha1: string,
        size: number,
        totalSize: number,
        url: string
    ) {
        this.id = id;
        this.sha1 = sha1;
        this.size = size;
        this.totalSize = totalSize;
        this.url = url;
    }

    static emptyAssetIndexArtifactMeta(): AssetIndexArtifactMeta {
        return AssetIndexArtifactMeta.EMPTY_INSTANCE;
    }

    static fromObject(obj: unknown): AssetIndexArtifactMeta {
        if (typeof obj === "object") {
            // @ts-ignore
            const sz = String(obj["size"]);
            // @ts-ignore
            const tsz = String(obj["totalSize"]);
            let szInt = parseInt(sz);
            let tszInt = parseInt(tsz);
            szInt = isNaN(szInt) ? 0 : szInt;
            tszInt = isNaN(tszInt) ? 0 : tszInt;
            // @ts-ignore
            if (!obj["id"]) {
                return AssetIndexArtifactMeta.emptyAssetIndexArtifactMeta();
            }
            return new AssetIndexArtifactMeta(
                // @ts-ignore
                String(obj["id"]),
                // @ts-ignore
                String(obj["sha1"]),
                szInt,
                tszInt,
                // @ts-ignore
                String(obj["url"])
            );
        }
        return AssetIndexArtifactMeta.emptyAssetIndexArtifactMeta();
    }

    clone(): AssetIndexArtifactMeta {
        return new AssetIndexArtifactMeta(
            this.id,
            this.sha1,
            this.size,
            this.totalSize,
            this.url
        );
    }
}

export class AssetIndexFileMeta {
    objects: AssetMeta[];
    isLegacy: boolean;

    constructor(objects: AssetMeta[], isLegacy: boolean) {
        this.objects = objects;
        this.isLegacy = isLegacy;
    }

    static fromObject(
        obj: Record<string, unknown>,
        isLegacy: boolean
    ): AssetIndexFileMeta {
        const objs: AssetMeta[] = [];
        if (typeof obj["objects"] === "object") {
            for (const x of Object.getOwnPropertyNames(obj["objects"])) {
                objs.push(AssetMeta.fromObject(safeGet(obj, ["objects", x]), x));
            }
        }
        return new AssetIndexFileMeta(objs, isLegacy);
    }

    clone(): AssetIndexFileMeta {
        return new AssetIndexFileMeta(
            this.objects.map((o) => {
                return o.clone();
            }),
            this.isLegacy
        );
    }
}

export class AssetMeta {
    hash: string;
    size: number;
    path: string;

    constructor(hash: string, size: number, path: string) {
        this.hash = hash;
        this.size = size;
        this.path = path;
    }

    static fromObject(obj: unknown, path: string): AssetMeta {
        let hash = "";
        let size = 0;
        // @ts-ignore
        if (typeof obj["hash"] === "string") {
            // @ts-ignore
            hash = obj["hash"];
        }
        // @ts-ignore
        if (typeof obj["size"] === "string") {
            // @ts-ignore
            const pInt = parseInt(String(obj["size"]));
            {
                if (!isNaN(pInt)) {
                    size = pInt;
                }
            }
        }
        // @ts-ignore
        if (typeof obj["size"] === "number") {
            // @ts-ignore
            size = obj["size"];
        }
        return new AssetMeta(hash, size, path);
    }

    clone(): AssetMeta {
        return new AssetMeta(this.hash, this.size, this.path);
    }
}
