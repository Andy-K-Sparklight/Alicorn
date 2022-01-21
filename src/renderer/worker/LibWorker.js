import { readFile } from "fs-extra";
import leven from "js-levenshtein";
import fs from "fs-extra";
import path from "path";
import mdiff from "mdiff";
import sha from "sha";
import CryptoJS from "crypto-js";
const HANDLERS = new Map();

onmessage = (e) => {
  if (e.data instanceof Array) {
    const data = e.data.concat();
    const eid = data.shift();
    const task = data.shift();
    const r = callHandler(task, data);
    if (r instanceof Promise) {
      r.then((d) => {
        postMessage([eid, d]);
      }).catch(() => {});
    } else {
      postMessage([eid, r]);
    }
  }
};

addHandler("POST", () => {
  console.log("...Magic! Hello from worker. I'm ready!");
});

addHandler("Close", () => {
  close();
});

addHandler("SHA1", async (o) => {
  return CryptoJS.SHA1(o).toString();
});

addHandler("SHA256", async (o) => {
  return CryptoJS.SHA256(o).toString();
});

addHandler("Sha256File", async (target) => {
  let s = await readFile(target);
  return CryptoJS.SHA256(s.toString()).toString();
});

addHandler("DirSize", async (dir, symlink) => {
  return await getContainerSize(dir, symlink);
});

addHandler("Sha1File", (target) => {
  return new Promise((resolve) => {
    sha.get(target, (e, s) => {
      if (e) {
        resolve("");
      } else {
        resolve(s);
      }
    });
  });
});

addHandler("StrDiff", (str1, str2) => {
  const ed = leven(str1, str2);
  const lcs = mdiff(str1, str2).getLcs()?.length || 0;
  return ed * 2 - lcs * 8 + 30 + str2.length;
});

async function getContainerSize(dir, symlink) {
  try {
    const op = symlink ? await fs.stat(dir) : await fs.lstat(dir);
    if (op.isDirectory()) {
      const dirs = await fs.readdir(dir);
      return (
        (
          await Promise.all(
            dirs.map(async (d) => {
              return await getContainerSize(path.join(dir, d), symlink);
            })
          )
        ).reduce((p, c) => {
          return p + c;
        }) + op.size
      );
    } else {
      return op.size;
    }
  } catch {
    return 0;
  }
}

function callHandler(n, args) {
  const f = HANDLERS.get(n);
  if (typeof f === "function") {
    return f(...args);
  }
}

function addHandler(n, f) {
  if (typeof f === "function" && typeof n === "string") {
    HANDLERS.set(n, f);
  }
}

const DIR_BLACKLIST = [
  "proc",
  "etc",
  "node_modules",
  "tmp",
  "dev",
  "sys",
  "drivers",
  "var",
  "src",
  "config",
  "icons",
  "themes",
  ".npm",
  "cache",
  "font",
  "fonts",
  "doc",
];

const DIR_BLACKLIST_INCLUDE =
  /windows|microsoft|common files|\/usr\/share|\/usr\/local\/share|\/usr\/local\/include|\/usr\/lib\/firmware|\/usr\/lib\/python|\/usr\/lib\/[^/]+?-linux-gnu|\/usr\/include/i;

// SLOW reclusive function
function diveSearch(
  fileName,
  rootDir,
  concatArray,
  depth = 5,
  counter = 0,
  any = false,
  superres
) {
  return new Promise((res) => {
    void (async () => {
      if (depth !== 0 && counter > depth) {
        res();
        return;
      }
      try {
        const all = await fs.readdir(rootDir);

        if (all.includes(fileName)) {
          const aPath = path.resolve(rootDir, fileName);
          if (path.basename(path.dirname(aPath)).toLowerCase() === "bin") {
            if ((await fs.stat(aPath)).isFile()) {
              concatArray.push(aPath);
              res(); // File found, no deeper
              if (any) {
                if (superres) {
                  superres();
                }
              }
              return;
            }
          }
        }
        await Promise.allSettled(
          all.map(async (s) => {
            const currentBase = path.resolve(rootDir, s);
            if ((await fs.stat(currentBase)).isDirectory()) {
              if (
                DIR_BLACKLIST.includes(s.toLowerCase()) ||
                DIR_BLACKLIST_INCLUDE.test(currentBase)
              ) {
                return;
              }
              await diveSearch(
                fileName,
                currentBase,
                concatArray,
                depth,
                counter + 1,
                any,
                superres ? superres : any ? res : undefined
              );
            }
          })
        );
        res();
        return;
      } catch {
        res();
        return;
      }
    })();
  });
}

// Return an array
addHandler("DiveSearch", async (filename, rootDir, depth, counter, any) => {
  const arr = [];
  await diveSearch(filename, rootDir, arr, depth, counter, any);
  return arr;
});
