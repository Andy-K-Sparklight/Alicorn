import fs, { WriteStream } from "fs-extra";
import { IntervalChecker } from "../commons/WatchDog";
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

export function getFileWriteStream(pt: string): WritableStream {
  const f = fs.createWriteStream(pt);
  return new WritableStream({
    write(chk) {
      return new Promise<void>((res, rej) => {
        f.write(chk, (e) => {
          if (e) {
            rej(e);
          } else {
            res();
          }
        });
      });
    },
    close() {
      f.close();
    },
    abort(e) {
      console.log(e);
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
