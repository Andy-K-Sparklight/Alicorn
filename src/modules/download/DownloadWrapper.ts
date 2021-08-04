import EventEmitter from "events";
import { tr } from "../../renderer/Translator";
import { getModifiedDate, isFileExist } from "../commons/FileUtil";
import { getBoolean, getNumber } from "../config/ConfigSupport";
import { getAllContainers, getContainer } from "../container/ContainerUtil";
import { fetchSharedFile, isSharedContainer } from "../container/SharedFiles";
import {
  deleteRecord,
  getLastValidateModified,
  updateRecord,
} from "../container/ValidateRecord";
import { DownloadMeta, DownloadStatus } from "./AbstractDownloader";
import { Concurrent } from "./Concurrent";
import { applyMirror } from "./Mirror";
import { Serial } from "./Serial";
import { validate } from "./Validate";

const DOINGX: string[] = [];
const DOING_X_SUBSCRIBES: Map<string, (d: string) => unknown> = new Map();
export function addDoing(s: string): void {
  DOINGX.unshift(s);
  for (const [_n, f] of DOING_X_SUBSCRIBES) {
    f(s);
  }
  if (DOINGX.length > 3) {
    DOINGX.pop();
  }
}

export function clearDoing(): void {
  for (const [_n, f] of DOING_X_SUBSCRIBES) {
    f("");
  }
  DOINGX.pop();
  DOINGX.pop();
  DOINGX.pop();
}

export function getDoing(): string {
  return DOINGX[0] || "";
}

export function subscribeDoing(
  name: string,
  func: (d: string) => unknown
): void {
  DOING_X_SUBSCRIBES.set(name, func);
}

export function unsubscribeDoing(name: string): void {
  DOING_X_SUBSCRIBES.delete(name);
}
const DOING: string[] = [];

const PENDING_TASKS: DownloadMeta[] = [];
const RUNNING_TASKS = new Set<DownloadMeta>();

const WAITING_RESOLVES_MAP = new Map<
  DownloadMeta,
  (value: DownloadStatus | PromiseLike<DownloadStatus>) => void
>();
const FAILED_COUNT_MAP: Map<DownloadMeta, number> = new Map();
const END_GATE = "END";
let EMITTER: EventEmitter;

export function initDownloadWrapper(): void {
  EMITTER = new EventEmitter();
  EMITTER.on(END_GATE, (m: DownloadMeta, s: DownloadStatus) => {
    RUNNING_TASKS.delete(m);
    FAILED_COUNT_MAP.delete(m);
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
export async function wrappedDownloadFile(
  meta: DownloadMeta,
  noAutoLn = false
): Promise<DownloadStatus> {
  const ou = meta.url;
  // POST
  if (meta.url.trim().length === 0 || meta.savePath.trim().length === 0) {
    addState(tr("ReadyToLaunch.Got", `Url=${ou}`));
    return DownloadStatus.RESOLVED;
  }
  addState(tr("ReadyToLaunch.Getting", `Url=${ou}`));
  if (!noAutoLn) {
    const a = getAllContainers();
    let targetContainer = "";
    a.forEach((c) => {
      if (meta.savePath.includes(getContainer(c).rootDir)) {
        targetContainer = c;
      }
    });
    if (
      targetContainer.length > 0 &&
      (await isSharedContainer(getContainer(targetContainer)))
    ) {
      if (await fetchSharedFile(meta)) {
        addState(tr("ReadyToLaunch.Got", `Url=${ou}`));
        return DownloadStatus.RESOLVED;
      }
    }
  }
  const mirroredMeta = new DownloadMeta(
    applyMirror(meta.url),
    meta.savePath,
    meta.sha1
  );
  FAILED_COUNT_MAP.set(mirroredMeta, getConfigOptn("tries-per-chunk", 3));
  if ((await _wrappedDownloadFile(mirroredMeta)) === 1) {
    FAILED_COUNT_MAP.delete(mirroredMeta);
    addState(tr("ReadyToLaunch.Got", `Url=${ou}`));
    return DownloadStatus.RESOLVED;
  }
  FAILED_COUNT_MAP.delete(mirroredMeta);
  FAILED_COUNT_MAP.set(meta, getConfigOptn("tries-per-chunk", 3));
  const s = await _wrappedDownloadFile(meta);
  FAILED_COUNT_MAP.delete(meta);
  if (s === 1) {
    addState(tr("ReadyToLaunch.Got", `Url=${ou}`));
  } else {
    addState(tr("ReadyToLaunch.Failed", `Url=${ou}`));
  }
  return s;
}

export async function existsAndValidate(meta: DownloadMeta): Promise<boolean> {
  return await _existsAndValidate(meta.savePath, meta.sha1);
}

export async function existsAndValidateRaw(
  pt: string,
  sha1: string
): Promise<boolean> {
  return await _existsAndValidate(pt, sha1);
}

// Cached file validate
// If no sha provided, we'll ignore it
async function _existsAndValidate(pt: string, sha1: string): Promise<boolean> {
  if (!(await isFileExist(pt))) {
    deleteRecord(pt);
    return false;
  }
  if (sha1.trim() === "") {
    // This might be a wrong SHA, we should not cache it
    return true;
  }
  const lastValidated = getLastValidateModified(pt);
  const actualModifiedDate = await getModifiedDate(pt);
  if (actualModifiedDate <= lastValidated) {
    return true;
  }
  const res = await validate(pt, sha1);
  if (res) {
    updateRecord(pt);
  } else {
    deleteRecord(pt);
  }
  return res;
}

function _wrappedDownloadFile(meta: DownloadMeta): Promise<DownloadStatus> {
  return new Promise<DownloadStatus>((resolve) => {
    existsAndValidate(meta).then((b) => {
      if (b) {
        resolve(DownloadStatus.RESOLVED);
      } else {
        WAITING_RESOLVES_MAP.set(meta, resolve);
        PENDING_TASKS.push(meta);
        scheduleNextTask();
      }
    });
  });
}

function scheduleNextTask(): void {
  // An aggressive call! Clear the stack.
  const CURRENT_MAX = getConfigOptn("max-tasks", 20);
  while (RUNNING_TASKS.size < CURRENT_MAX && PENDING_TASKS.length > 0) {
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
      if (s === 1) {
        FAILED_COUNT_MAP.delete(meta);
        emitter.emit(END_GATE, meta, DownloadStatus.RESOLVED);
        return;
      } else if (s === 0) {
        const failed = FAILED_COUNT_MAP.get(meta) || 0;
        if (failed <= 0) {
          // The last fight!
          FAILED_COUNT_MAP.set(meta, getConfigOptn("tries-per-chunk", 3));
          Serial.getInstance()
            .downloadFile(meta)
            .then((s) => {
              if (s === 1) {
                FAILED_COUNT_MAP.delete(meta);
                emitter.emit(END_GATE, meta, DownloadStatus.RESOLVED);
                return;
              } else {
                // Simply fatal, retry is meaningless
                emitter.emit(END_GATE, meta, DownloadStatus.FATAL);
                return;
              }
            });
          return;
        } else {
          FAILED_COUNT_MAP.set(meta, failed - 1);
          downloadSingleFile(meta, emitter);
        }
      } else {
        // Fatal, simply switch to serial
        FAILED_COUNT_MAP.set(meta, getConfigOptn("tries-per-chunk", 3));
        Serial.getInstance()
          .downloadFile(meta)
          .then((s) => {
            if (s === 1) {
              FAILED_COUNT_MAP.delete(meta);
              emitter.emit(END_GATE, meta, DownloadStatus.RESOLVED);
              return;
            } else {
              // Fatal
              emitter.emit(END_GATE, meta, DownloadStatus.FATAL);
              return;
            }
          });
        return;
      }
    });
}

export interface WrapperStatus {
  inStack: number;
  pending: number;
  doing: string;
}

export function getWrapperStatus(): WrapperStatus {
  return {
    inStack: RUNNING_TASKS.size || 0,
    pending: PENDING_TASKS.length || 0,
    doing: DOING[0] || "",
  };
}

const PFF_FLAG = "Downloader.IsPff";

function getPffFlag(): string {
  return window.sessionStorage.getItem(PFF_FLAG) || "0";
}

export function getConfigOptn(name: string, def: number): number {
  if (getPffFlag() === "1") {
    return (
      getNumber("download.pff." + name, 0) ||
      getNumber("download.concurrent." + name, def)
    );
  } else {
    return getNumber("download.concurrent." + name, def);
  }
}

export function setProxy(_host: string, _port: number): void {
  // window.sessionStorage.setItem(PROXY_HOST, host);
  // window.sessionStorage.setItem(PROXY_PORT, port.toString());
}

export function addState(s: string): void {
  console.log(s);
  addDoing(s);
  DOING.unshift(s);
  if (DOING.length > 3) {
    DOING.pop();
  }
}
