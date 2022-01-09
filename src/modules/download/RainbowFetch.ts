import fs from "fs-extra";
import { PassThrough, Readable } from "stream";
import { submitWarn } from "../../renderer/Message";
import { tr } from "../../renderer/Translator";
import { WatchDog } from "../commons/WatchDog";
import { getNumber } from "../config/ConfigSupport";
import { MirrorChain } from "./Mirror";
export function getGuardStream(
  i: Readable,
  f: fs.WriteStream,
  timeout = 0
): PassThrough {
  let dog: WatchDog | null = null;
  const s = new PassThrough();
  f.on("error", (e) => {
    dog?.kill();
    f.close();
    s.emit("error", "Stream ERR: " + e);
  });
  f.on("finish", () => {
    dog?.kill();
    f.close();
  });
  if (timeout > 0) {
    dog = new WatchDog(timeout * 2, () => {
      f.close();
      s.emit("error", "Time limit exceeded: " + timeout * 2);
    });
    s.on("data", () => {
      dog?.feed();
    });
    i.on("end", () => {
      dog?.kill();
    });
  }

  return s;
}
export function getFileWriteStream(
  pt: string,
  sti: () => unknown = () => {},
  thrower: () => unknown = () => {},
  timeout = 0
): WritableStream {
  let dog: WatchDog | null = null;
  let f: fs.WriteStream;
  try {
    f = fs.createWriteStream(pt, { mode: 0o777 });
  } catch (e) {
    submitWarn(tr("System.EPERM"));
    throw e;
  }
  if (timeout > 0) {
    dog = new WatchDog(timeout * 2, () => {
      f.close();
      thrower();
    });
  }
  let p = true;
  f.on("error", () => {
    dog?.kill();
    f.close(); // Close anyway
    thrower();
  });
  f.on("finish", () => {
    dog?.kill();
    f.close(); // Close anyway
  });
  return new WritableStream({
    write(chk) {
      if (p) {
        sti();
        p = false;
      }
      if (f.writable) {
        return new Promise<void>((res, rej) => {
          f.write(chk, (e) => {
            if (e) {
              rej(e);
            } else {
              dog?.feed();
              res();
            }
          });
        });
      }
      return Promise.reject();
    },
    close() {
      dog?.kill();
      f.close();
    },
    abort(e) {
      console.log(e);
      f.close();
    },
  });
}

export function getTimeoutController(
  timeout: number
): [controller: AbortController, canceller: () => void] {
  const ac = new AbortController();
  let t: NodeJS.Timeout | null = null;
  if (timeout > 0) {
    t = setTimeout(() => {
      ac.abort();
    }, timeout);
  }
  return [
    ac,
    () => {
      if (t) {
        clearTimeout(t);
      }
    },
  ];
}

export async function isWebFileExist(u: string): Promise<string> {
  const mrc = new MirrorChain(u);
  while (mrc.mirror() !== u) {
    try {
      const [controller, sti] = getTimeoutController(
        getNumber("download.concurrent.timeout", 5000)
      );
      const r = await fetch(mrc.mirror(), {
        signal: controller.signal,
        credentials: "omit",
      });
      const s = r.ok;
      sti();
      controller.abort(); // Abort this
      if (s) {
        return u;
      }
      mrc.markBad();
    } catch {
      // If only timeout then just continue, but not mark bad
      mrc.next();
    }
  }
  const [controller, sti] = getTimeoutController(
    getNumber("download.concurrent.timeout", 5000)
  );
  const r = await fetch(u, { signal: controller.signal, credentials: "omit" });
  sti();
  if (r.ok) {
    return u;
  }
  throw "File not exist: " + u;
}
