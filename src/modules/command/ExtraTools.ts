import { submitInfo, submitWarn } from "../../renderer/Message";
import { DownloadMeta } from "../download/AbstractDownloader";
import { Concurrent } from "../download/Concurrent";
import { applyMirror } from "../download/Mirror";
import { Serial } from "../download/Serial";
import { registerCommand } from "./CommandListener";

let time: Date | undefined;

export function initExtraTools(): void {
  registerCommand("timer", async () => {
    if (time === undefined) {
      time = new Date();
      submitInfo("Started timing.");
    } else {
      const s = (new Date().getTime() - time.getTime()) / 1000;
      time = undefined;
      submitInfo("Time elapsed: " + s + "s");
    }
  });
  registerCommand("download", async (a) => {
    let u = a.shift();
    const t = a.shift();
    const flags = a.map((s) => {
      return s.toLowerCase();
    });
    if (u && t) {
      if (!flags.includes("nomirror")) {
        u = applyMirror(u);
      }
      submitInfo("Downloading " + u + " ...");
      let s;
      if (flags.includes("concurrent")) {
        s = await Concurrent.getInstance().downloadFile(new DownloadMeta(u, t));
      } else {
        s = await Serial.getInstance().downloadFile(new DownloadMeta(u, t));
      }
      if (s === 1) {
        submitInfo("Download completed, file saved to " + t);
      } else {
        submitInfo("Failed to download file!");
      }
    } else {
      submitWarn("Url or target path is missing! Skipped.");
    }
  });
}
