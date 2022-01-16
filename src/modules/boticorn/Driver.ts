import { gzip } from "compressing";
import { remove } from "fs-extra";
import { submitError, submitInfo } from "../../renderer/Message";
import { isFileExist } from "../commons/FileUtil";
import { getBoolean } from "../config/ConfigSupport";
import { getActualDataPath } from "../config/DataSupport";
import { DownloadMeta } from "../download/AbstractDownloader";
import { wrappedDownloadFile } from "../download/DownloadWrapper";
import { getHash } from "../download/Validate";

const MODEL_FILE = "https://alicorn-mc-bot.pages.dev/driver.bundle.js.gz";
const MODEL_SHA = "https://alicorn-mc-bot.pages.dev/driver.bundle.js.sha1sum";
const LOCAL_MODEL = "boticorn.js";
let BOT_WORKER: Worker;

export async function initBotWorker(): Promise<void> {
  BOT_WORKER = new Worker("BotWorker.js");
  const fun = (e: MessageEvent) => {
    const data = e.data;
    if (data instanceof Array) {
      const f = TASK_ID_MAP.get(data[0]);
      if (f) {
        f(data[1]);
      }
    }
  };
  BOT_WORKER.onmessage = fun;
  BOT_WORKER.onerror = (e) => {
    submitError(e.message);
    console.log(e.message);
  };
  await sendToBot("", true);
}

export async function initBoticorn(): Promise<void> {
  let upgrade = false;
  if (getBoolean("interactive.boticorn")) {
    if (!(await isBoticornAvailable())) {
      upgrade = true;
      await upgradeBoticorn();
    }
    console.log("Enabling Boticorn...");
    await initBotWorker();
    console.log("Testing Boticorn. 你好……");
    console.log("Answer from Boticorn: " + (await sendToBot("你好")).answer);
    window.addEventListener("CadanceInput", async (e) => {
      if (getBoolean("interactive.boticorn")) {
        if (window.location.hash.includes("Cadance")) {
          return;
        }
        if (e instanceof CustomEvent) {
          const cab = (await sendToBot(String(e.detail))).answer;
          if (!cab) {
            return;
          }
          if (!cab.startsWith("AL:")) {
            submitInfo(cab);
          } else {
            try {
              // @ts-ignore
              eval(`(Alicorn)=>{${cab.slice(3)}}`)(window._al_func_table);
            } catch {}
          }
        }
      }
    });
    if (!upgrade) {
      await upgradeBoticorn(); // Do the update later
    }
  }
}

export async function upgradeBoticorn(): Promise<boolean> {
  if (await isBoticornAvailable()) {
    const remoteSha = await fetch(MODEL_SHA);
    if (remoteSha.ok) {
      const data = await remoteSha.text();
      const hsh = await getHash(getActualDataPath(LOCAL_MODEL));
      if (
        hsh.toLowerCase().trim() ===
        data.split(" ").shift()?.toLowerCase().trim()
      ) {
        return true; // Latest
      }
    }
  }
  if (
    (await wrappedDownloadFile(
      new DownloadMeta(MODEL_FILE, getActualDataPath(LOCAL_MODEL) + ".gz")
    )) === 1
  ) {
    await gzip.uncompress(
      getActualDataPath(LOCAL_MODEL) + ".gz",
      getActualDataPath(LOCAL_MODEL)
    );
    await remove(getActualDataPath(LOCAL_MODEL) + ".gz");
    return true;
  } else {
    return false;
  }
}

export async function isBoticornAvailable(): Promise<boolean> {
  return await isFileExist(getActualDataPath(LOCAL_MODEL));
}

interface Answer {
  answer: string;
  entities: { entity: string; utterance: string }[];
}

const TASK_ID_MAP: Map<number, (value: Answer) => void> = new Map();
let cEid = 0;

export function sendToBot(input: string, init = false): Promise<Answer> {
  return new Promise<Answer>((res) => {
    cEid++;
    TASK_ID_MAP.set(cEid, res);
    if (!init) {
      BOT_WORKER.postMessage([cEid, input]);
    } else {
      BOT_WORKER.postMessage({
        init: getActualDataPath(LOCAL_MODEL),
        eid: cEid,
      });
    }
  });
}
