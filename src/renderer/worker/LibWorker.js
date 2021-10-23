import { readFile } from "fs-extra";
import leven from "js-levenshtein";
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
  return "...Magic!";
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
  return CryptoJS.SHA256(s.toString());
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
