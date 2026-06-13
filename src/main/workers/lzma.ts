// LZMA decompression worker.

import { decompress, initWasm } from "lzma-wasm";
import workerPool from "workerpool";

await initWasm();

workerPool.worker({ decompress });
