import {
  ArtifactMeta,
  AssetIndexArtifactMeta,
  LibraryMeta,
  OptionalArgument,
} from "./Meta";

export class GameProfile {
  gameArgs: string[] = [];
  jvmArgs: OptionalArgument[] = [];
  assetIndex: AssetIndexArtifactMeta;
  clientArtifact: ArtifactMeta;
  // The 'path' property in 'client' and 'server' will be reassigned before downloading
  id: string;
  libraries: LibraryMeta[] = [];
  logArg: string;
  logFile: ArtifactMeta;
  mainClass: string;
  releaseTime: Date;
  time: Date;
  type: ReleaseType;

  // Also 'fromObject'
  constructor(obj: Record<string, unknown>) {
    try {
      this.id = String(obj["id"]);
      switch (obj["type"]) {
        case "release":
          this.type = ReleaseType.RELEASE;
          break;
        case "snapshot":
          this.type = ReleaseType.SNAPSHOT;
          break;
        default:
          this.type = ReleaseType.MODIFIED;
      }
      this.releaseTime = new Date(String(obj["releaseTime"]));
      this.time = new Date(String(obj["time"]));
      this.mainClass = String(obj["mainClass"]);
      this.logArg = String(safeGet(obj, ["logging", "client", "argument"]));

      // I'm so sorry ponies
      this.logFile = ArtifactMeta.fromObject(
        safeGet(obj, ["logging", "client", "file"]) as Record<string, unknown>
      );
      const rawArgsGame = safeGet(obj, ["arguments", "game"]);
      if (rawArgsGame instanceof Array) {
        const actArgsGame = [];
        for (const r of rawArgsGame) {
          if (typeof r === "string") {
            actArgsGame.push(r);
          }
        }
        this.gameArgs = actArgsGame;
      }

      const rawArgsJ = safeGet(obj, ["arguments", "jvm"]);
      if (rawArgsJ instanceof Array) {
        const actArgsJ = [];
        for (const r of rawArgsJ) {
          if (typeof r === "string") {
            actArgsJ.push(OptionalArgument.fromString(r));
          } else {
            actArgsJ.push(
              OptionalArgument.fromObject(r as Record<string, unknown>)
            );
          }
        }
        this.jvmArgs = actArgsJ;
      }

      const asIndex = obj["assetIndex"];
      this.assetIndex = AssetIndexArtifactMeta.fromObject(asIndex);

      this.clientArtifact = ArtifactMeta.fromObject(
        Object.assign(
          safeGet(obj, ["downloads", "client"]) || {},
          { path: this.id + ".jar" } // Only a temporary assignment
        )
      );

      const allLibraries = obj["libraries"];
      if (allLibraries instanceof Array) {
        for (const l of allLibraries) {
          this.libraries.push(LibraryMeta.fromObject(l));
        }
      }
    } catch (e) {
      throw new Error("Invalid Profile! Caused by: " + e);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeGet(obj: any, properties: string[]): unknown {
  try {
    let node = obj;
    for (const x of properties) {
      node = node[x];
    }
    return node;
  } catch {
    return null;
  }
}

enum ReleaseType {
  RELEASE = "release",
  SNAPSHOT = "snapshot",
  MODIFIED = "modified", // Nonofficial profiles
}

// TODO WIP
