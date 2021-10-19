import fs, { WriteStream } from "fs-extra";
import { IntervalChecker, WatchDog } from "../commons/WatchDog";
import { getNumber } from "../config/ConfigSupport";
import { MirrorChain } from "./Mirror";
export function guardPipeFile(
  origin: NodeJS.ReadableStream,
  target: WriteStream,
  timeout?: number
): Promise<void> {
  const pipingStream = origin.pipe(target);

  return new Promise((res, rej) => {
    let dog: IntervalChecker | null = null;
    if (timeout) {
      let lastPiped = 0;
      dog = new IntervalChecker(
        timeout,
        () => {
          const b = pipingStream.bytesWritten > lastPiped;
          lastPiped = pipingStream.bytesWritten;
          console.log(b);
          console.log(lastPiped);
          return b;
        },
        () => {
          pipingStream.close();
          target.close();
          rej();
        }
      );
    }
    pipingStream.on("finish", () => {
      if (dog) {
        dog.kill();
      }
      res();
    });
    pipingStream.on("error", (e) => {
      if (dog) {
        dog.kill();
      }
      rej(e);
    });
  });
}

export function getFileWriteStream(
  pt: string,
  sti: () => unknown = () => {},
  thrower: () => unknown = () => {},
  timeout = 0
): WritableStream {
  let dog: WatchDog | null = null;
  const f = fs.createWriteStream(pt);
  if (timeout > 0) {
    dog = new WatchDog(timeout, () => {
      f.close();
      thrower();
    });
  }
  let p = true;
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
      const r = await fetch(mrc.mirror(), { signal: controller.signal });
      sti();
      if (r.ok) {
        return u;
      }
      mrc.markBad();
    } catch {
      mrc.markBad();
    } finally {
      mrc.next();
    }
  }
  const [controller, sti] = getTimeoutController(
    getNumber("download.concurrent.timeout", 5000)
  );
  const r = await fetch(u, { signal: controller.signal });
  sti();
  if (r.ok) {
    return u;
  }
  throw "File not exist: " + u;
}
