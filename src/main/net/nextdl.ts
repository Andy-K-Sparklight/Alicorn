/**
 * The next generation download module designed for Alicorn.
 *
 * Comparing to the wrapped downloader, the next downloader runs on the main process and utilizes the net module from
 * Electron. This is expected to bypass the connection limit in the browser window and maximize the throughput.
 */
import { cache } from "@/main/cache/cache";
import { conf } from "@/main/conf/conf";
import { dlchk } from "@/main/net/dlchk";
import { isTruthy } from "@/main/util/misc";
import { net } from "electron";
import fs from "fs-extra";
import { nanoid } from "nanoid";
import EventEmitter from "node:events";
import path from "node:path";
import { Stream } from "node:stream";
import type TypedEmitter from "typed-emitter";

/**
 * Events emitted when downloading.
 */
type NextDownloadEvents = {
    /**
     * Emitted when the status of a task changes.
     */
    change: (id: string) => void;
}

const emitter = new EventEmitter() as TypedEmitter<NextDownloadEvents>;
emitter.setMaxListeners(0);

export enum NextDownloadStatus {
    PENDING,
    RETRIEVING,
    VALIDATING,
    DONE,
    FAILED
}

/**
 * A network-level download request for fetching the given resources and save them to the given path.
 */
export interface NextDownloadRequest {
    urls: string[];
    origin: string;
    path: string;
    sha1?: string;
    size?: number;
    signal?: AbortSignal;
    fastLink?: boolean;
}

export interface NextDownloadTask {
    id: string;
    req: NextDownloadRequest;
    status: NextDownloadStatus;
    signal?: AbortSignal;

    // The current active URL
    activeURL: string;

    // The time the download begins
    startTime: number;

    // The total length of the content
    bytesTotal: number;

    // The transferred length of the content
    bytesTransferred: number;
}

/**
 * Internal status enum indicating the result of a transfer request.
 */
enum NextRequestStatus {
    SUCCESS,
    RETRY,
    FATAL
}

/**
 * Resolves the download task for the maximum number of tries specified.
 */
async function get(req: NextDownloadRequest): Promise<void> {
    const task = createTask(req);

    console.debug(`NextDL Get: ${task.req.origin}`);

    // First try to reuse existing files
    if (task.req.sha1) {
        await cache.deploy(task.req.path, task.req.sha1, !!task.req.fastLink);
    }

    // Preflight validate
    // For files that cannot be validated, re-downloading is suggested and therefore not skipped
    const valid = await dlchk.validate({ ...task.req }) === "checked";

    if (valid) {
        console.debug(`NextDL Hit: ${task.req.origin}`);
        task.status = NextDownloadStatus.DONE;
        return;
    }

    task.req.signal?.throwIfAborted();

    for (const url of task.req.urls) {
        let tries = conf().net.next.tries;

        task.activeURL = url;

        while (tries > 0) {
            const st = await resolveOnce(task);
            if (st === NextRequestStatus.FATAL) {
                tries = 0;
            }
            if (st === NextRequestStatus.SUCCESS) {
                console.debug(`NextDL Got: ${task.req.origin} (Using ${task.activeURL})`);
                task.status = NextDownloadStatus.DONE;

                // Add file for reusing
                await cache.enroll(task.req.path, task.req.sha1);

                return;
            }

            tries--;
        }
    }

    console.debug(`NextDL Err: ${task.req.origin}`);
    task.status = NextDownloadStatus.FAILED;
    throw `Task failed: ${task.req.origin}`;
}

/**
 * Resolves the download task once.
 */
async function resolveOnce(task: NextDownloadTask): Promise<NextRequestStatus> {
    if (task.signal?.aborted) return NextRequestStatus.FATAL;

    task.status = NextDownloadStatus.RETRIEVING;
    const res = await retrieve(task);

    if (res === NextRequestStatus.SUCCESS) {
        if (conf().net.validate) {
            task.status = NextDownloadStatus.VALIDATING;
            // Here we accept both 'checked' and 'unknown'
            // As we have no clue to reject a file when we cannot determine it's corrupted
            const valid = await dlchk.validate({ ...task.req }) !== "failed";
            return valid ? NextRequestStatus.SUCCESS : NextRequestStatus.RETRY;
        } else {
            return NextRequestStatus.SUCCESS;
        }
    }

    return res;
}

/**
 * An implementation of the download task, capable for dispatching events when specific properties change.
 */
class DownloadTaskImpl implements NextDownloadTask {
    id = nanoid();
    req;
    activeURL;
    signal?: AbortSignal = undefined;

    constructor(req: NextDownloadRequest) {
        if (req.urls.length === 0) throw "No URL specified";
        this.req = {
            ...req,
            path: path.resolve(req.path)
        };
        this.activeURL = req.urls[0];
    }

    private _status: NextDownloadStatus = NextDownloadStatus.PENDING;

    get status() {
        return this._status;
    }

    set status(value: NextDownloadStatus) {
        this._status = value;
        this.notify();
    }

    private _startTime = -1;

    get startTime(): number {
        return this._startTime;
    }

    set startTime(value: number) {
        this._startTime = value;
        this.notify();
    }

    private _bytesTotal = -1;

    get bytesTotal(): number {
        return this._bytesTotal;
    }

    set bytesTotal(value: number) {
        this._bytesTotal = value;
        this.notify();
    }

    private _bytesTransferred = -1;

    get bytesTransferred(): number {
        return this._bytesTransferred;
    }

    set bytesTransferred(value: number) {
        this._bytesTransferred = value;
        this.notify();
    }

    private notify = () => emitter.emit("change", this.id);
}

/**
 * Creates a task based on the given request.
 */
function createTask(req: NextDownloadRequest): NextDownloadTask {
    return new DownloadTaskImpl(req);
}

/**
 * Starts a request to the task URL and tries to fetch its content.
 */
async function retrieve(task: NextDownloadTask): Promise<NextRequestStatus> {
    task.startTime = Date.now();

    console.debug(`Get: ${task.activeURL}`);

    const { requestTimeout, minSpeed } = conf().net.next;

    const timeoutSignal = requestTimeout > 0 ? AbortSignal.timeout(requestTimeout) : null;

    const signal = AbortSignal.any([task.signal, timeoutSignal].filter(isTruthy));

    let res: Response | null = null;

    try {
        res = await net.fetch(task.activeURL, {
            credentials: "omit",
            keepalive: true,
            signal
        });

        if (!res.ok || !res.body) {
            if (res.status >= 400 && res.status < 500) {
                console.warn(`Irrecoverable status code: ${res.status}`);
                return NextRequestStatus.FATAL; // When encountering such status code a retry may only bring limited effect
            }
            console.warn(`Unexpected status code: ${res.status}`);
            return NextRequestStatus.RETRY;
        }
    } catch (e) {
        console.warn(`Fetch request failed: ${e}`);
        return NextRequestStatus.RETRY;
    }


    try {
        await fs.ensureFile(task.req.path);
        const writeStream = Stream.Writable.toWeb(fs.createWriteStream(task.req.path)) as WritableStream<Uint8Array>;
        const guardStream = createTransferGuardStream(minSpeed);
        const countStream = createBytesCountingStream((b) => task.bytesTransferred = b);
        await res.body.pipeThrough(guardStream).pipeThrough(countStream).pipeTo(writeStream);
        return NextRequestStatus.SUCCESS;
    } catch (e) {
        console.warn(`Error when transferring data: ${e}`);
        return NextRequestStatus.RETRY;
    }
}

/**
 * Creates a transform stream which counts bytes transferred and aborts the transfer when the speed is slower than the
 * given limit.
 */
function createTransferGuardStream(minSpeed: number): TransformStream<Uint8Array, Uint8Array> {
    let lastUpdateTime = Date.now();
    let tries = 0;
    return new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
            const currentTime = Date.now();
            const speed = chunk.byteLength / ((currentTime - lastUpdateTime) / 1000);
            lastUpdateTime = currentTime;

            if (speed < minSpeed) {
                tries++;
                if (tries >= 3) {
                    controller.error(`Transfer speed too slow (${minSpeed}B/s)`);
                    return;
                }
            } else {
                tries = 0;
            }
            controller.enqueue(chunk);
        }
    });
}

/**
 * Creates a transform stream that counts the bytes transferred. Notifies the caller via a callback function.
 */
function createBytesCountingStream(onChange: (b: number) => void): TransformStream<Uint8Array, Uint8Array> {
    let bytes = 0;
    let lastBytes = 0;
    return new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
            bytes += chunk.byteLength;

            // Throttle every 64K
            if (bytes - lastBytes > 1024 * 64) {
                onChange(bytes);
                lastBytes = bytes;
            }
            controller.enqueue(chunk);
        }
    });
}


export const nextdl = { get };
