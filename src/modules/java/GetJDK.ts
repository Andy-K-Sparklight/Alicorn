import { load } from "cheerio";
import childProcess from "child_process";
import os from "os";
import { basicHash } from "../commons/BasicHash";
import { getActualDataPath } from "../config/DataSupport";
import { DownloadMeta } from "../download/AbstractDownloader";
import { wrappedDownloadFile } from "../download/DownloadWrapper";

const JDK_BASE_URL = "https://mirror.tuna.tsinghua.edu.cn/AdoptOpenJDK/";
const OLD_JAVA = "8";
const NEW_JAVA = "17";

// Currently we cannot support *nix users
export async function getLatestJREURL(old = false): Promise<string> {
  if (os.platform() !== "win32") {
    throw new Error("Does not support this platform!");
  }
  const bits = os.arch();
  let cv = "";
  if (bits === "ia32") {
    cv = "x32";
  } else if (bits === "x64") {
    cv = "x64";
  } else {
    throw new Error("Does not support this arch!");
  }
  const u = `${JDK_BASE_URL}${old ? OLD_JAVA : NEW_JAVA}/jdk/${cv}/windows/`;
  const res = await fetch(u, {
    method: "GET",
    credentials: "omit",
  });
  const X = load(await res.text());
  const ls = X("table#list > tbody > tr");
  if (ls.length === 0) {
    return "";
  }
  return new Promise<string>((resolve) => {
    const all = [];
    for (const e of ls.get()) {
      const s = X(e)
        .children("td.link")
        .first()
        .children("a")
        .first()
        .attr("href");
      if (typeof s === "string" && s.endsWith(".msi")) {
        all.push(s);
      }
    }
    // First OpenJ9
    for (const a of all) {
      if (a.includes("openj9") && a.toLowerCase().includes("openjdk")) {
        resolve(u + a);
        return;
      }
    }
    // Then Hotspot
    for (const a of all) {
      if (a.includes("hotspot") && a.toLowerCase().includes("openjdk")) {
        resolve(u + a);
        return;
      }
    }
  });
}

async function downloadAndStartJREInstaller(u: string): Promise<void> {
  const tD = getActualDataPath(`jdk_installer_tmp_${basicHash(u)}.msi`);

  const s = await wrappedDownloadFile(new DownloadMeta(u, tD, ""));
  if (s === 1) {
    childProcess.exec(`"${tD}"`);
  } else {
    throw new Error("Could not download!");
  }
}

export async function downloadJREInstaller(u: string): Promise<void> {
  const tD = getActualDataPath(`jdk_installer_tmp_${basicHash(u)}.msi`);
  const s = await wrappedDownloadFile(new DownloadMeta(u, tD, ""));
  if (s !== 1) {
    throw new Error("Could not download!");
  }
}

export function waitJREInstaller(u: string): Promise<void> {
  const tD = getActualDataPath(`jdk_installer_tmp_${basicHash(u)}.msi`);
  return new Promise<void>((res) => {
    void (() => {
      const s = childProcess.exec(`"${tD}""`);
      s.on("exit", () => {
        res();
      });
      s.on("error", () => {
        res();
      });
    })();
  });
}

export async function installJRE(old = false): Promise<void> {
  const u = await getLatestJREURL(old);
  const url = new URL(u);
  await downloadAndStartJREInstaller(url.toString());
}
