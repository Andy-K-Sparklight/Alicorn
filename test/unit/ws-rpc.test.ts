import assert from "node:assert/strict";
import { test } from "node:test";
import { WebSocketJsonRpcClient } from "@/main/net/ws-rpc";

test("WebSocket notifications deliver their response payload", async () => {
    const socket = {
        addEventListener() {},
        onmessage: null as ((event: MessageEvent) => void) | null,
    } as unknown as WebSocket;
    const client = new WebSocketJsonRpcClient(socket);

    const received = Promise.withResolvers<{ gid: string }>();
    client.on("aria2.onDownloadComplete", received.resolve);

    socket.onmessage?.(
        new MessageEvent("message", {
            data: JSON.stringify({
                method: "aria2.onDownloadComplete",
                params: [{ gid: "download-1" }],
            }),
        }),
    );

    assert.deepEqual(await received.promise, { gid: "download-1" });
});
