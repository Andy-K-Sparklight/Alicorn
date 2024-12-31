/**
 * A wrapper around NextDL providing mirror chaining and progress tracking.
 */
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

    let canceled = false;

    console.log(`Checked ${req.length} tasks and ready for download.`);

    const nextTasks: NextDownloadRequest[] = req.map(r => ({ ...r, urls: mirror.apply(r.url) }));

    const handlers = nextdl.gets(nextTasks);

    function cancelAll() {
        if (canceled) return;
        canceled = true;
        console.log("Cancelling tasks in the same group.");
        handlers.forEach(([, t]) => nextdl.cancel(t));
    }

    const promises = handlers.map(async ([p, t], i) => {
        const r = req[i];
        if (await p) {
            const mirrorHint = t.activeURL === r.url ? "" : `(Using ${t.activeURL})`;
            console.log(`Got: ${r.url} ${mirrorHint}`);

            prog.value.current++;
            init?.onProgress?.(prog);
        } else {
            console.error(`ERR! ${r.url}`);
            cancelAll();
        }
    });

    await Promise.all(promises);
}

export const dlx = { getAll };