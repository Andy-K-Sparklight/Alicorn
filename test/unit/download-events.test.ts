import assert from "node:assert/strict";
import { test } from "node:test";
import Emittery from "emittery";
import { type DownloadEvents, waitForDownload } from "@/main/net/download-events";

test("download completion resolves and removes listeners", async () => {
    const emitter = new Emittery<DownloadEvents<Error>>();
    const done = waitForDownload(emitter);

    await emitter.emit("finish");
    await done;

    assert.equal(emitter.listenerCount("finish"), 0);
    assert.equal(emitter.listenerCount("error"), 0);
});

test("download failure rejects with its original payload", async () => {
    const emitter = new Emittery<DownloadEvents<Error>>();
    const failure = new Error("download failed");
    const done = waitForDownload(emitter);

    await emitter.emit("error", failure);
    await assert.rejects(done, error => error === failure);

    assert.equal(emitter.listenerCount("finish"), 0);
    assert.equal(emitter.listenerCount("error"), 0);
});
