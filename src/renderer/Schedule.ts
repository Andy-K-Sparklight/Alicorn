import { submitError } from "./Message";

let WORKER: Worker;

export function schedulePromiseTask<T>(
  fn: () => Promise<T>,
  timeout?: number
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    window.requestIdleCallback(
      () => {
        fn()
          .then((r) => {
            resolve(r);
          })
          .catch((e) => {
            reject(e);
          });
      },
      timeout ? { timeout: timeout } : undefined
    );
  });
}

export async function initWorker(): Promise<void> {
  WORKER = new Worker("LibWorker.js");
  const fun = (e: MessageEvent) => {
    const data = e.data;
    if (data instanceof Array) {
      const f = TASK_ID_MAP.get(data[0]);
      if (f) {
        f(data[1]);
      }
    }
  };
  WORKER.addEventListener("message", fun);
  console.log("Checking worker. Friendship is...");
  console.log(await invokeWorker("POST"));
  WORKER.onerror = (e) => {
    submitError(e.message);
    console.log(e.message);
  };
}

const TASK_ID_MAP: Map<number, (value: unknown) => void> = new Map();
let cEid = 0;
export function invokeWorker(
  task: string,
  ...args: unknown[]
): Promise<unknown> {
  const eid = ++cEid;
  args.unshift(task);
  args.unshift(eid);
  WORKER.postMessage(args);
  return new Promise<unknown>((resolve) => {
    TASK_ID_MAP.set(eid, resolve);
  });
}
