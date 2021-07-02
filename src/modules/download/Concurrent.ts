import {
  AbstractDownloader,
  DownloadMeta,
  DownloadStatus,
} from "./AbstractDownloader";
import { getNumber } from "../config/ConfigSupport";
import got from "got";
import fs from "fs-extra";
import objectHash from "object-hash";
import os from "os";
import path from "path";
import { Serial } from "./Serial";
import { getHash, validate } from "./Validate";
import { isFileExist } from "../commons/FileUtil";
import { addRecord } from "./ResolveLock";

const TEMP_SAVE_PATH_ROOT = path.join(os.tmpdir(), "alicorn-download");

export async function initConcurrentDownloader(): Promise<void> {
  await fs.ensureDir(TEMP_SAVE_PATH_ROOT);
}

export class Concurrent extends AbstractDownloader {
  private static instance: Concurrent = new Concurrent();

  static getInstance(): Concurrent {
    return Concurrent.instance;
  }

  async downloadFile(meta: DownloadMeta): Promise<DownloadStatus> {
    try {
      // If file already exists then check if HASH matches
      if (meta.sha1 !== "" && (await isFileExist(meta.savePath))) {
        if (await validate(meta.savePath, meta.sha1)) {
          return DownloadStatus.RESOLVED;
        }
      }
      const fileSize = await getSize(meta.url);
      if (
        fileSize <=
        getNumber("download.concurrent.chunk-size", 1024) * 1024
      ) {
        // Too small or invalid, use serial instead
        return await Serial.getInstance().downloadFile(meta);
      }
      const allChunks = generateChunks(fileSize);
      await Promise.all(getAllPromises(meta, fileSize, allChunks));
      await sealAndVerify(meta.url, meta.savePath, allChunks, meta.sha1);
      return DownloadStatus.RESOLVED;
    } catch (e) {
      console.log(e);
      return DownloadStatus.FAILED;
    }
  }
}

async function sealAndVerify(
  url: string,
  savePath: string,
  chunks: Chunk[],
  hash: string
) {
  await fs.createFile(savePath);
  const wStream = fs.createWriteStream(savePath);
  for (const c of chunks) {
    const pt = path.join(
      TEMP_SAVE_PATH_ROOT,
      generatePath(objectHash(savePath), c.start, c.end)
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
  if (hash === "") {
    return;
  }
  const h = await getHash(savePath);

  if (hash !== h) {
    throw new Error("File hash mismatch for " + savePath);
  }
  addRecord(h, url);
  return;
}

async function getSize(url: string): Promise<number> {
  try {
    const response = await got.get(url, {
      timeout: getNumber("download.concurrent.timeout", 5000),
      headers: { Range: "bytes=0-1" },
    });
    const rangeString = response.headers["content-range"];
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
  size: number,
  chunks: Chunk[]
): Promise<void>[] {
  const allPromises = [];
  const savePathHash = objectHash(meta.savePath);
  for (const c of chunks) {
    const tmpFileSavePath = path.join(
      TEMP_SAVE_PATH_ROOT,
      generatePath(savePathHash, c.start, c.end)
    );

    allPromises.push(downloadSingleChunk(meta.url, tmpFileSavePath, c));
  }
  return allPromises;
}

function generatePath(hash: string, start: number, end: number) {
  return `${hash}@${start}-${end}.tmp`;
}

async function downloadSingleChunk(
  url: string,
  tmpSavePath: string,
  chunk: Chunk
) {
  const buffer = (
    await got.get(url, {
      timeout: getNumber("download.concurrent.timeout", 5000),
      cache: false,
      headers: {
        Range: `bytes=${chunk.start}-${chunk.end}`,
      },
    })
  ).rawBody;
  await fs.writeFile(tmpSavePath, buffer);
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
    let end =
      pointer + getNumber("download.concurrent.chunk-size", 1024) * 1024 - 1;
    if (end > size) {
      end = size;
    }
    result.push(new Chunk(pointer, end));
    pointer += getNumber("download.concurrent.chunk-size", 1024) * 1024;
  }
  return result;
}
