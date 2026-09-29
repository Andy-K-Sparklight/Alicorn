import type Emittery from "emittery";

export type DownloadEvents<Failure> = { finish: undefined; error: Failure };

/** Waits for a download to finish and propagates its failure payload. */
export async function waitForDownload<Failure>(
    emitter: Emittery<DownloadEvents<Failure>>,
): Promise<void> {
    const finish = emitter.once("finish");
    const failure = emitter.once("error");

    try {
        await Promise.race([
            finish,
            failure.then(({ data }) => {
                throw data;
            }),
        ]);
    } finally {
        finish.off();
        failure.off();
    }
}
