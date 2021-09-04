import fs, { WriteStream } from "fs-extra";
import { IncomingMessage } from "http";
import https from "https";
import { IntervalChecker } from "../commons/WatchDog";
export function guardPipeFile(
  origin: NodeJS.ReadableStream,
  target: WriteStream,
  timeout?: number
): Promise<void> {
  console.log("Guarded pipe!");
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

export function getStream(
  url: string,
  timeout?: number
): Promise<IncomingMessage> {
  const pu = new URL(url);
  console.log(pu);
  return new Promise<IncomingMessage>((res, rej) => {
    const req = https.request(url, (s) => {
      if (s.statusCode && s.statusCode >= 200 && s.statusCode < 300) {
        res(s);
      } else {
        rej(s.statusMessage);
      }
    });
    req.setHeader("Connection", "keep-alive");
    if (timeout) {
      req.setTimeout(timeout, rej);
    }
    req.setNoDelay(true);
    req.setSocketKeepAlive(true);
    req.method = "GET";
    req.end();
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
