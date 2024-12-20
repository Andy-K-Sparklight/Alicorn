/**
 * The next generation download module designed for Alicorn.
 *
 * Comparing to the wrapped downloader, the next downloader runs on the main process and utilizes the net module from
 * Electron. This is expected to bypass the connection limit in the browser window and maximize the throughput.
 */
import type { DownloadRequest } from "@/main/net/types";
import { net } from "electron";
import { conf } from "@/main/conf/conf";
import fs from "fs-extra";
import { Stream } from "node:stream";
import { hashFile } from "hasha";
import { nanoid } from "nanoid";
import PQueue from "p-queue";
import EventEmitter from "events";
import type TypedEmitter from "typed-emitter/rxjs";

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

export interface NextDownloadTask {
    id: string;
    req: DownloadRequest;
    status: NextDownloadStatus;

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

let queue: PQueue | null = null;

function getQueue(): PQueue {
    if (queue === null) {
        queue = new PQueue({ concurrency: conf().net.next.concurrency });
    }
    return queue;
}

/**
 * Builds a task for the given request and schedule them to be run in the global queue.
 *
 * Returns an array of 2 elements. The first is a promise which resolves when the download completes with a boolean
 * value indicating the status. The second is the task object.
 */
function get(req: DownloadRequest): [Promise<boolean>, NextDownloadTask] {
    const t = createTask(req);
    return [getQueue().add(() => resolve(t)).then(it => !!it), t];
}

/**
 * Resolves the download task for the maximum number of tries specified.
 */
async function resolve(task: NextDownloadTask): Promise<boolean> {
    // Preflight validate
    let valid = false;
    if (conf().net.next.validate) {
        valid = await validate(task);
    } else {
        try {
            await fs.access(task.req.path);
            valid = true;
        } catch {}
    }

    if (valid) {
        task.status = NextDownloadStatus.DONE;
        return true;
    }

    for (const url of task.req.urls) {
        let tries = conf().net.next.tries;

        task.activeURL = url;

        while (tries > 0) {
            const st = await resolveOnce(task);
            if (st === NextRequestStatus.FATAL) {
                tries = 0;
            }
            if (st === NextRequestStatus.SUCCESS) {
                task.status = NextDownloadStatus.DONE;
                return true;
            }

            tries--;
        }
    }

    task.status = NextDownloadStatus.FAILED;
    return false;
}

/**
 * Resolves the download task once.
 */
async function resolveOnce(task: NextDownloadTask): Promise<NextRequestStatus> {
    task.status = NextDownloadStatus.RETRIEVING;
    const res = await retrieve(task);
    if (res === NextRequestStatus.SUCCESS) {
        if (conf().net.next.validate) {
            task.status = NextDownloadStatus.VALIDATING;
            const valid = await validate(task);
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
    private notify = () => emitter.emit("change", this.id);
    private _status: NextDownloadStatus = NextDownloadStatus.PENDING;
    private _startTime = -1;
    private _bytesTotal = -1;
    private _bytesTransferred = -1;


    constructor(req: DownloadRequest) {
        if (req.urls.length === 0) throw "No URL specified";
        this.req = req;
        this.activeURL = req.urls[0];
    }

    get status() {
        return this._status;
    }

    set status(value: NextDownloadStatus) {
        this._status = value;
        this.notify();
    }

    get startTime(): number {
        return this._startTime;
    }

    set startTime(value: number) {
        this._startTime = value;
        this.notify();
    }

    get bytesTotal(): number {
        return this._bytesTotal;
    }

    set bytesTotal(value: number) {
        this._bytesTotal = value;
        this.notify();
    }

    get bytesTransferred(): number {
        return this._bytesTransferred;
    }

    set bytesTransferred(value: number) {
        this._bytesTransferred = value;
        this.notify();
    }
}

/**
 * Creates a task based on the given request.
 */
function createTask(req: DownloadRequest): NextDownloadTask {
    return new DownloadTaskImpl(req);
}

/**
 * Starts a request to the task URL and tries to fetch its content.
 */
async function retrieve(task: NextDownloadTask): Promise<NextRequestStatus> {
    task.startTime = Date.now();

    const { requestTimeout, minSpeed } = conf().net.next;

    const abortController = new AbortController();
    let timeout: NodeJS.Timeout | null = null;

    if (requestTimeout > 0) {
        timeout = setTimeout(() => {
            abortController.abort(`Request time exceeded (${requestTimeout}ms)`);
        }, requestTimeout);
    }

    let res: Response | null = null;

    try {
        res = await net.fetch(task.activeURL, {
            credentials: "omit",
            keepalive: true,
            signal: abortController.signal
        });

        if (timeout) {
            clearTimeout(timeout);
        }

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
        const writeStream = Stream.Writable.toWeb(fs.createWriteStream(task.req.path));
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
 * Validates the integrity of the task.
 */
async function validate(task: NextDownloadTask): Promise<boolean> {
    try {
        await fs.access(task.req.path);
    } catch {
        // Fail silently as the file does not exist
        return false;
    }

    try {
        if (task.req.sha1) {
            const h = await hashFile(task.req.path);
            return task.req.sha1.toLowerCase() === h.toLowerCase();
        }

        if (task.req.size && task.req.size > 0) {
            const st = await fs.stat(task.req.path);
            return st.size === task.req.size;
        }

        return true; // No validation method available
    } catch (e) {
        console.warn(`Error when validating file: ${e}`);
        return false;
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
    return new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
            bytes += chunk.byteLength;
            onChange(bytes);
            controller.enqueue(chunk);
        }
    });
}

export const nextdl = { get };