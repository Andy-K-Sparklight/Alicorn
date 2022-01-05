import fs from "fs-extra";
import os from "os";
import path from "path";
import { submitWarn } from "../../renderer/Message";
import { tr } from "../../renderer/Translator";
import { basicHash } from "../commons/BasicHash";
import { alterPath } from "../commons/FileUtil";
import { getBoolean, getString } from "../config/ConfigSupport";
import { getBasePath } from "../config/PathSolve";
import {
  AbstractDownloader,
  DownloadMeta,
  DownloadStatus,
} from "./AbstractDownloader";
import { getConfigOptn } from "./DownloadWrapper";
import { getFileWriteStream, getTimeoutController } from "./RainbowFetch";
import { Serial } from "./Serial";
import { getHash } from "./Validate";

let TEMP_SAVE_PATH_ROOT: string;
let CONC_AVAILABLE = true;

export async function initConcurrentDownloader(): Promise<void> {
  TEMP_SAVE_PATH_ROOT = await alterPath(
    path.join(os.tmpdir(), "alicorn-download"),
    path.join(os.homedir(), "alicorn-download"),
    path.join(getBasePath(), "alicorn-download")
  );
  if (TEMP_SAVE_PATH_ROOT.length > 0) {
    await fs.ensureDir(TEMP_SAVE_PATH_ROOT);
  } else {
    CONC_AVAILABLE = false;
  }
}

export class Concurrent extends AbstractDownloader {
  private static instance: Concurrent = new Concurrent();

  static getInstance(): Concurrent {
    return Concurrent.instance;
  }

  async downloadFile(
    meta: DownloadMeta,
    overrideTimeout?: boolean
  ): Promise<DownloadStatus> {
    if (
      !CONC_AVAILABLE ||
      getString("download.primary-downloader") !== "Concurrent"
    ) {
      return await Serial.getInstance().downloadFile(meta);
    }
    try {
      // If file already exists then check if HASH matches
      /* if (meta.sha1 !== "" && (await isFileExist(meta.savePath))) {
        if (await validate(meta.savePath, meta.sha1, meta.size)) {
          return DownloadStatus.RESOLVED;
        }
      } */

      await fs.ensureDir(path.dirname(meta.savePath));
      const fileSize = meta.size ? meta.size : await getSize(meta.url);
      if (fileSize <= getConfigOptn("chunk-size", 1024) * 1024) {
        return await Serial.getInstance().downloadFile(meta);
      }
      const allChunks = generateChunks(fileSize);
      await Promise.all(getAllPromises(meta, allChunks, overrideTimeout));
      await sealAndVerify(meta.savePath, allChunks, meta.sha1, fileSize);
      return DownloadStatus.RESOLVED;
    } catch (e) {
      console.log(e);
      return DownloadStatus.RETRY; // Let wrapper retry, but not herself
    }
  }
}

async function sealAndVerify(
  savePath: string,
  chunks: Chunk[],
  hash: string,
  size: number
) {
  let wStream: fs.WriteStream;
  try {
    wStream = fs.createWriteStream(savePath, { mode: 0o777 });
  } catch (e) {
    submitWarn(tr("System.EPERM"));
    throw e;
  }
  for (const c of chunks) {
    const pt = path.join(
      TEMP_SAVE_PATH_ROOT,
      generatePath(basicHash(savePath), c.start, c.end)
    );
    await new Promise<void>((resolve, reject) => {
      const rStream = fs.createReadStream(pt);
      rStream.pipe(wStream, { end: false });
      rStream.on("end", () => {
        resolve();
      });
      rStream.on("error", (e) => {
        reject(e);
      });
    });
    await fs.unlink(pt);
  }

  wStream.close();
  if (hash === "" || getBoolean("download.skip-validate")) {
    return;
  }

  const s = await fs.stat(savePath);
  if (s.size !== size) {
    throw new Error("File size mismatch for " + savePath);
  }
  const h = await getHash(savePath);
  if (hash !== h) {
    throw new Error("File hash mismatch for " + savePath);
  }
  return;
}

async function getSize(url: string): Promise<number> {
  try {
    const [ac, sti] = getTimeoutController(getConfigOptn("timeout", 5000));
    const response = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-1" },
      signal: ac.signal,
      keepalive: true,
      credentials: "omit",
    });
    sti();
    const rangeString = response.headers.get("content-range");
    if (typeof rangeString !== "string") {
      return 0;
    }
    // Content-Range format: "bytes=s-e/total"
    return parseInt(rangeString.split("/").pop() || "0");
  } catch {
    return 0;
  }
}

function getAllPromises(
  meta: DownloadMeta,
  chunks: Chunk[],
  overrideTimeout?: boolean
): Promise<void>[] {
  const allPromises = [];
  const savePathHash = basicHash(meta.savePath);
  for (const c of chunks) {
    const tmpFileSavePath = path.join(
      TEMP_SAVE_PATH_ROOT,
      generatePath(savePathHash, c.start, c.end)
    );

    allPromises.push(
      downloadSingleChunk(meta.url, tmpFileSavePath, c, overrideTimeout)
    );
  }
  return allPromises;
}

function generatePath(hash: string, start: number, end: number) {
  return `${hash}.${start}-${end}.tmp`; // This name is quite safe?
}

function downloadSingleChunk(
  url: string,
  tmpSavePath: string,
  chunk: Chunk,
  overrideTimeout?: boolean
) {
  return new Promise<void>((resolve, reject) => {
    (async () => {
      const [ac, sti] = getTimeoutController(
        overrideTimeout ? 0 : getConfigOptn("timeout", 5000)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let f: WritableStream<any>;
      try {
        f = getFileWriteStream(
          tmpSavePath,
          sti,
          () => {
            reject();
          },
          overrideTimeout ? 0 : getConfigOptn("timeout", 5000)
        );
      } catch {
        throw "Failed to write! Path: " + tmpSavePath;
      }
      const r = await fetch(url, {
        signal: ac.signal,
        method: "GET",
        headers: { Range: `bytes=${chunk.start}-${chunk.end}` },
        keepalive: true,
        credentials: "omit",
      });
      if (!r.ok) {
        throw "Failed to download! Code: " + r.status;
      }
      if (r.body) {
        try {
          await r.body.pipeTo(f);
        } catch (e) {
          try {
            await fs.remove(tmpSavePath);
          } catch {}
          console.log(e);
          throw e;
        }
      } else {
        sti();
        throw "Body is empty!";
      }
    })()
      .then(() => {
        resolve();
      })
      .catch((e) => {
        console.log(e);
        reject(e);
      });
  });
}

class Chunk {
  start: number;

  end: number;

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }
}

function generateChunks(size: number): Chunk[] {
  const result = [];
  let pointer = 0;
  while (pointer < size) {
    let end = pointer + getConfigOptn("chunk-size", 1024) * 1024 - 1;
    if (end > size) {
      end = size;
    }
    result.push(new Chunk(pointer, end));
    pointer += getConfigOptn("chunk-size", 1024) * 1024;
  }
  return result;
}
