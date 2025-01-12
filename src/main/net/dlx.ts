/**
 * A wrapper around NextDL providing mirror chaining and progress tracking.
 */
import { conf } from "@/main/conf/conf";
import { aria2, type Aria2DownloadRequest } from "@/main/net/aria2";
import { mirror } from "@/main/net/mirrors";
import { nextdl, type NextDownloadRequest } from "@/main/net/nextdl";
import type { Progress } from "@/main/util/progress";

export interface DlxDownloadRequest {
    url: string;
    path: string;
    sha1?: string;
    size?: number;
}

interface DlxDownloadInit {
    onProgress?: (p: Progress) => void;
}


/**
 * Resolves all given download requests with mirrors applied.
 */
async function getAll(req: DlxDownloadRequest[], init?: DlxDownloadInit): Promise<void> {
    const prog: Progress = {
        type: "count",
        value: {
            current: 0,
            total: req.length
        }
    };

    let dl = conf().net.downloader;
    if (dl === "aria2" && !aria2.available()) {
        dl = "next";
    }

    let canceled = false;

    function incProgress() {
        prog.value.current++;
        init?.onProgress?.(prog);
    }

    console.log(`Resolving ${req.length} tasks (${dl}).`);

    let promises: Promise<unknown>[] = [];

    if (dl === "aria2") {
        const aria2Tasks: Aria2DownloadRequest[] = req.map(r => ({
            ...r,
            urls: mirror.apply(r.url),
            origin: r.url
        }));
        const res = await Promise.all(aria2Tasks.map(t => aria2.resolve(t)));

        function cancelAllAria2() {
            if (canceled) return;
            canceled = true;
            console.log("Cancelling tasks in the same group.");
            res.forEach(([, gid]) => aria2.remove(gid));
        }

        promises = res.map(async ([p], i) => {
            const r = req[i];
            if (await p) {
                console.log(`Got: ${r.url}`);

                incProgress();
            } else {
                console.error(`ERR! ${r.url}`);
                cancelAllAria2();
                throw `Task failed: ${r.url}`;
            }
        });


    } else if (dl === "next") {
        const nextTasks: NextDownloadRequest[] = req.map(r => ({
            ...r,
            urls: mirror.apply(r.url),
            origin: r.url
        }));

        const handlers = nextdl.gets(nextTasks);

        function cancelAllNext() {
            if (canceled) return;
            canceled = true;
            console.log("Cancelling tasks in the same group.");
            handlers.forEach(([, t]) => nextdl.cancel(t));
        }

        promises = handlers.map(async ([p, t], i) => {
            const r = req[i];
            if (await p) {
                const mirrorHint = t.activeURL === r.url ? "" : `(Using ${t.activeURL})`;
                console.log(`Got: ${r.url} ${mirrorHint}`);

                incProgress();
            } else {
                console.error(`ERR! ${r.url}`);
                cancelAllNext();
                throw `Task failed: ${r.url}`;
            }
        });
    } else {
        throw `Unknown downloader: ${dl}`;
    }

    await Promise.all(promises);
}

export const dlx = { getAll };