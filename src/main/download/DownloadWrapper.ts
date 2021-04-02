import { DownloadMeta, DownloadStatus } from "./AbstractDownloader";
import { Concurrent } from "./Concurrent";
import { Serial } from "./Serial";
import { applyMirror } from "./Mirror";
import { getNumber } from "../config/ConfigSupport";
import EventEmitter from "events";
import { validate } from "./Validate";
import { isFileExist } from "../config/FileUtil";

const PENDING_TASKS: DownloadMeta[] = [];
const RUNNING_TASKS = new Set<DownloadMeta>();
const WAITING_RESOLVES_MAP = new Map<
  DownloadMeta,
  (value: DownloadStatus | PromiseLike<DownloadStatus>) => void
>();
const END_GATE = "END";
let MAX_TASKS: number;
let EMITTER: EventEmitter;

export function initDownloadWrapper(): void {
  MAX_TASKS = getNumber("download.concurrent.max-tasks", 20);
  EMITTER = new EventEmitter();
  EMITTER.on(END_GATE, (m: DownloadMeta, s: DownloadStatus) => {
    RUNNING_TASKS.delete(m);
    (
      WAITING_RESOLVES_MAP.get(m) ||
      (() => {
        return;
      })
    )(s);
    scheduleNextTask();
  });
}

// Download one file
// Mirror will be applied here
// There are no options for user to choose downloader
// Concurrent will always be used first
// If file already exists, downloader will resolve if hash matches
export function wrappedDownloadFile(
  meta: DownloadMeta
): Promise<DownloadStatus> {
  const mirroredMeta = new DownloadMeta(
    applyMirror(meta.url),
    meta.savePath,
    meta.sha1
  );
  return new Promise<DownloadStatus>((resolve) => {
    existsAndValidate(mirroredMeta).then((b) => {
      if (b) {
        resolve(DownloadStatus.RESOLVED);
      } else {
        WAITING_RESOLVES_MAP.set(mirroredMeta, resolve);
        PENDING_TASKS.push(mirroredMeta);
        scheduleNextTask();
      }
    });
  });
}

function scheduleNextTask(): void {
  if (RUNNING_TASKS.size < MAX_TASKS && PENDING_TASKS.length > 0) {
    const tsk = PENDING_TASKS.pop();
    if (tsk !== undefined) {
      RUNNING_TASKS.add(tsk);
      downloadSingleFile(tsk, EMITTER);
    }
  }
}

function downloadSingleFile(meta: DownloadMeta, emitter: EventEmitter): void {
  Concurrent.getInstance()
    .downloadFile(meta)
    .then((s) => {
      if (s === DownloadStatus.RESOLVED) {
        emitter.emit(END_GATE, meta, DownloadStatus.RESOLVED);
      } else {
        Serial.getInstance()
          .downloadFile(meta)
          .then((s) => {
            emitter.emit(END_GATE, meta, s);
          });
      }
    });
}

async function existsAndValidate(meta: DownloadMeta): Promise<boolean> {
  if (meta.sha1 !== "" && (await isFileExist(meta.savePath))) {
    if (await validate(meta.savePath, meta.sha1)) {
      return true;
    }
  }
  return false;
}
