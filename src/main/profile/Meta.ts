import os from "os";

// This file is UNCHECKED!

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
}

export class ArtifactMeta {
  url: string;
  sha1: string;
  path: string;
  private static readonly EMPTY_INSTANCE = new ArtifactMeta("", "", "");

  static emptyArtifactMeta(): ArtifactMeta {
    return ArtifactMeta.EMPTY_INSTANCE;
  }

  constructor(url: string, sha1: string, path: string) {
    this.url = url;
    this.sha1 = sha1;
    this.path = path;
  }

  // TODO fromObject
}

export class LibraryMeta {
  artifact: ArtifactMeta;
  classifiers: ClassifiersMeta;
  isNative: boolean;
  rules: RuleSet;

  constructor(
    artifact: ArtifactMeta,
    cf: ClassifiersMeta,
    isNative: boolean,
    rules: RuleSet
  ) {
    this.artifact = artifact;
    this.classifiers = cf;
    this.isNative = isNative;
    this.rules = rules;
  }

  // TODO fromObject

  canApply(): boolean {
    return this.rules.judge();
  }
}

export class RuleSet {
  private readonly rules: Rule[] = [];

  private static readonly EMPTY_RULESET = new RuleSet();

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

  constructor(rules?: Rule[]) {
    this.rules = rules || [];
  }

  judge(): boolean {
    let originState = true;
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
export class Rule {
  isAllow: boolean;
  requireOSType: string;
  requireOSVersion: string;
  requireOSArch: string;
  private static readonly DO_NOTHING_RULE = new Rule(true);

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

function getCurrentOSNameAsMojang(): string {
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
  javadoc: ArtifactMeta;
  nativesLinux: ArtifactMeta;
  nativesMacOS: ArtifactMeta;
  nativesWindows: ArtifactMeta;
  sources: ArtifactMeta;

  private static readonly EMPTY_INSTANCE = new ClassifiersMeta(
    ArtifactMeta.emptyArtifactMeta(),
    ArtifactMeta.emptyArtifactMeta(),
    ArtifactMeta.emptyArtifactMeta(),
    ArtifactMeta.emptyArtifactMeta(),
    ArtifactMeta.emptyArtifactMeta()
  );

  static emptyClassifiersMeta(): ClassifiersMeta {
    return ClassifiersMeta.EMPTY_INSTANCE;
  }

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

  // TODO fromObject
}

export class AssetIndexArtifactMeta {
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

  // TODO fromObject
}

export class AssetIndexFileMeta {
  objects: AssetMeta[];

  constructor(objects: AssetMeta[]) {
    this.objects = objects;
  }

  // TODO fromObject
}

export class AssetMeta {
  hash: string;
  size: number;

  constructor(hash: string, size: number) {
    this.hash = hash;
    this.size = size;
  }

  static fromObject(obj: Record<string, unknown>): AssetMeta {
    let hash = "";
    let size = 0;
    if (typeof obj["hash"] === "string") {
      hash = obj["hash"];
    }
    if (typeof obj["size"] === "string") {
      const pInt = parseInt(obj["size"]);
      {
        if (!isNaN(pInt)) {
          size = pInt;
        }
      }
    }
    if (typeof obj["size"] === "number") {
      size = obj["size"];
    }
    return new AssetMeta(hash, size);
  }
}
