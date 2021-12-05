import { copyFile, createReadStream, ensureDir, remove } from "fs-extra";
import { createServer, Server } from "http";
import { toBase64 } from "js-base64";
import path from "path";
import { buildOfflinePlayerUUID, LocalAccount } from "../auth/LocalAccount";
import { basicHash } from "../commons/BasicHash";
import { isFileExist } from "../commons/FileUtil";
import { getActualDataPath } from "../config/DataSupport";
import { getHash } from "../download/Validate";
/*
This is a mini server for Yggdrasil impl of Authlib Injector
Skins are located in ~/alicorn/<skins|capes>/<name>
This server only allows single user (most player only start one instance!)
*/
let SERVER: Server | null = null;

const YG_PORT = 16377;
const MATCH_USERNAME_REGEX = /(?<=username=).+?(?=&)/i;
const MATCH_UUID_REGEX = /(?<=\/)[0-9A-Fa-f-]+/i;
export const ROOT_YG_URL = "http://localhost:" + YG_PORT;
export function initLocalYggdrasilServer(
  account: LocalAccount,
  model: "DEFAULT" | "SLIM" | "NONE"
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    void (async () => {
      try {
        let capeEnabled = true;
        let skinEnabled = true;
        let fName = "";
        let capeName = "";
        let mx = "NONE";
        if (model !== "NONE") {
          mx = model === "DEFAULT" ? "default" : "slim";
          fName = getActualDataPath(
            path.join(
              "skins",
              model.slice(0, 1) + "-" + basicHash(account.lastUsedUUID)
            )
          ); // Use uuid to find skin

          capeName = getActualDataPath(
            path.join(
              "skins",
              model.slice(0, 1) + "-CAPE-" + basicHash(account.lastUsedUUID)
            )
          );
          if (!(await isFileExist(fName))) {
            fName = getActualDataPath(
              path.join("skins", model.slice(0, 1) + "-" + "DEF")
            );
            if (!(await isFileExist(fName))) {
              console.log("Skin not found, disabled skin: " + fName);
              skinEnabled = false;
            }
          }
          if (!(await isFileExist(capeName))) {
            capeName = getActualDataPath(
              path.join("skins", model.slice(0, 1) + "-CAPE-" + "DEF")
            );
            if (!(await isFileExist(capeName))) {
              console.log("Cape not found, disabled cape: " + capeName);
              capeEnabled = false;
            }
          }
        } else {
          capeEnabled = false;
          skinEnabled = false;
        }

        const SKIN_HASH = skinEnabled ? await getHash(fName) : "";
        const CAPE_HASH = capeEnabled ? await getHash(capeName) : "";
        const CHAR_INFO = {
          id: account.lastUsedUUID,
          name: account.lastUsedUsername,
          properties: [
            {
              name: "textures",
              value: toBase64(
                JSON.stringify({
                  timestamp: new Date().getTime(),
                  profileId: account.lastUsedUUID,
                  profileName: account.accountName,
                  textures: {
                    SKIN: skinEnabled
                      ? {
                          url: ROOT_YG_URL + "/textures/" + SKIN_HASH,
                          metadata: {
                            model: mx,
                          },
                        }
                      : undefined,
                    CAPE: capeEnabled
                      ? {
                          url: ROOT_YG_URL + "/textures/" + CAPE_HASH,
                          metadata: {
                            model: mx,
                          },
                        }
                      : undefined,
                  },
                })
              ),
            },
          ],
        };

        if (SERVER) {
          SERVER.close(); // Close prev
          SERVER = null;
        }
        SERVER = createServer((req, res) => {
          const NAME_MAP_UUID = new Map<string, string>();
          if (!req.url) {
            res.writeHead(400, "Bad Request").end();
            return;
          }
          // In response to textures get
          if (
            skinEnabled &&
            req.url.toLowerCase() === "/textures/" + SKIN_HASH
          ) {
            try {
              const d = createReadStream(fName);
              res.writeHead(200, "OK", { "Content-Type": "image/png" });
              const r = d.pipe(res);
              r.on("finish", () => {
                d.close();
                res.end();
              });
              r.on("error", () => {
                d.close();
                res.end();
              });
            } catch {
              res.writeHead(500, "Internal Server Error");
            }
            return;
          }
          if (
            capeEnabled &&
            req.url.toLowerCase() === "/textures/" + CAPE_HASH
          ) {
            try {
              const d = createReadStream(capeName);
              res.writeHead(200, "OK", { "Content-Type": "image/png" });
              const r = d.pipe(res);
              r.on("finish", () => {
                d.close();
                res.end();
              });
              r.on("error", () => {
                d.close();
                res.end();
              });
            } catch {
              res.writeHead(500, "Internal Server Error");
            }
            return;
          }
          // In response to server auth
          if (
            req.url.toLowerCase() === "/sessionserver/session/minecraft/join"
          ) {
            res.writeHead(204, "No Content").end();
            return;
          }

          if (
            req.url
              .toLowerCase()
              .startsWith("/sessionserver/session/minecraft/hasjoined") ||
            req.url
              .toLowerCase()
              .startsWith("/sessionserver/session/minecraft/profile")
          ) {
            let uname = "";
            let uid = "";
            if (req.url) {
              const unameResult = req.url.match(MATCH_USERNAME_REGEX);
              if (unameResult) {
                uname = unameResult[0] || "";
              }
              const uidResult = req.url.match(MATCH_UUID_REGEX);
              if (uidResult) {
                uid = uidResult[0] || "";
              }
            }
            if (uname) {
              NAME_MAP_UUID.set(
                buildOfflinePlayerUUID(uname).toLowerCase(),
                uname
              );
            }
            if (uid) {
              if (NAME_MAP_UUID.has(uid.toLowerCase())) {
                uname = NAME_MAP_UUID.get(uid.toLowerCase()) || "";
              }
            }

            const outcome =
              uname.toLowerCase() !== account.lastUsedUsername.toLowerCase()
                ? buildCharInfo(uname)
                : JSON.stringify(CHAR_INFO);
            res.writeHead(200, "OK", {
              "Content-Type": "application/json; charset=utf-8",
            });
            res.end(outcome);
            return;
          }
          if (req.url.toLowerCase() === "/api/profiles/minecraft") {
            const outcome = JSON.stringify(
              [CHAR_INFO].concat(
                Array.from(NAME_MAP_UUID.values()).map((n) => {
                  return JSON.parse(buildCharInfo(n));
                })
              )
            );
            res.writeHead(200, "OK", {
              "Content-Type": "application/json; charset=utf-8",
            });
            res.end(outcome);
            return;
          }
          if (req.url.toLowerCase() === "/") {
            const outcome = JSON.stringify({
              meta: {
                serverName: "Carousel Boutique",
              },
              skinDomains: ["localhost", "localhost:" + YG_PORT],
            });
            res.writeHead(200, "OK", {
              "Content-Type": "application/json; charset=utf-8",
            });
            res.end(outcome);
            return;
          }
          res.writeHead(501, "Not Implemented").end();
        }).listen(YG_PORT, () => {
          console.log("Local Yggdrasil Server Is Running!");
          resolve();
        });
      } catch (e) {
        console.log(e);
        reject(e);
      }
    })();
  });
}
export async function skinTypeFor(
  account: LocalAccount
): Promise<"DEFAULT" | "SLIM" | "NONE"> {
  // if (!hasFlag(Flags.ENABLE_LOCAL_SKIN)) {
  // return "NONE";
  // }
  const slimF = getActualDataPath(
    path.join("skins", "S-" + basicHash(account.lastUsedUUID))
  );
  const defaultF = getActualDataPath(
    path.join("skins", "D-" + basicHash(account.lastUsedUUID))
  );
  const slimD = getActualDataPath(path.join("skins", "S-DEF"));
  const defaultD = getActualDataPath(path.join("skins", "D-DEF"));
  if (await isFileExist(slimF)) {
    return "SLIM";
  }
  if (await isFileExist(defaultF)) {
    return "DEFAULT";
  }
  if (await isFileExist(slimD)) {
    return "SLIM";
  }
  if (await isFileExist(defaultD)) {
    return "DEFAULT";
  }
  return "NONE";
}

export async function configureSkin(
  playerName: string,
  origin: string,
  model: "DEFAULT" | "SLIM",
  type: "-" | "-CAPE-" = "-"
): Promise<void> {
  const uid = new LocalAccount(playerName).lastUsedUUID;
  const target = getActualDataPath(
    path.join(
      "skins",
      (model === "DEFAULT" ? "D" : "S") + type + basicHash(uid)
    )
  );
  const rmTarget = getActualDataPath(
    path.join(
      "skins",
      (model === "DEFAULT" ? "S" : "D") + type + basicHash(uid)
    )
  );
  await ensureDir(path.dirname(target));
  await copyFile(origin, target);
  await remove(rmTarget);
}
export async function configureDefaultSkin(
  origin: string,
  model: "DEFAULT" | "SLIM",
  type: "-" | "-CAPE-" = "-"
): Promise<void> {
  const target = getActualDataPath(
    path.join("skins", (model === "DEFAULT" ? "D" : "S") + type + "DEF")
  );
  const rmTarget = getActualDataPath(
    path.join("skins", (model === "DEFAULT" ? "S" : "D") + type + "DEF")
  );
  await ensureDir(path.dirname(target));
  await copyFile(origin, target);
  await remove(rmTarget);
}

export async function removeSkin(
  playerName: string,
  type: "-" | "-CAPE-" = "-"
): Promise<void> {
  try {
    const uid = new LocalAccount(playerName).lastUsedUUID;
    const f1 = getActualDataPath(
      path.join("skins", "D" + type + basicHash(uid))
    );
    const f2 = getActualDataPath(
      path.join("skins", "S" + type + basicHash(uid))
    );
    await Promise.allSettled([remove(f1), remove(f2)]);
  } catch {}
}

function buildCharInfo(name: string): string {
  return JSON.stringify({
    id: buildOfflinePlayerUUID(name),
    name: name,
  });
}
