import { shell } from "electron";
import os from "os";
import path from "path";
import { getBoolean, set } from "../modules/config/ConfigSupport";
import { getContainer } from "../modules/container/ContainerUtil";
import { createNewContainer } from "../modules/container/ContainerWrapper";
import {
  downloadJREInstaller,
  getLatestJREURL,
  waitJREInstaller,
} from "../modules/java/GetJDK";
import {
  getAllJava,
  getJavaInfoRaw,
  parseJavaInfo,
  parseJavaInfoRaw,
  setDefaultJavaHome,
} from "../modules/java/JInfo";
import { whereJava } from "../modules/java/WhereJava";
import {
  downloadProfile,
  getProfileURLById,
} from "../modules/pff/get/MojangCore";
import { startInst } from "./Instruction";
import { submitInfo, submitSucc } from "./Message";
import { tr } from "./Translator";
export function waitInstDone(): Promise<void> {
  return new Promise<void>((res) => {
    const fun = () => {
      window.removeEventListener("InstructionEnd", fun);
      res();
    };
    window.addEventListener("InstructionEnd", fun);
  });
}

export async function waitJavaSearch(): Promise<boolean> {
  const r = await whereJava(true, true);
  if (r.length > 0) {
    return true;
  }
  return false;
}

export async function completeFirstRun(): Promise<void> {
  if (!getBoolean("first-run?")) {
    return;
  }
  await createNewContainer(
    getMCDefaultRootDir(),
    tr("FirstRun.Default") || "Minecraft"
  );
  const ct = getContainer(tr("FirstRun.Default") || "Minecraft");
  const u = await getProfileURLById("1.17.1");
  await Promise.allSettled([
    setupFirstJavaCheck(),
    downloadProfile(u, ct, "1.17.1"),
  ]);
  set("first-run?", false);
}

function getMCDefaultRootDir(): string {
  switch (os.platform()) {
    case "win32":
      return path.join(
        process.env["APPDATA"] || path.join(os.homedir(), "AppData", "Roaming"),
        ".minecraft"
      );
    case "darwin":
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "minecraft"
      );
    case "linux":
    default:
      return path.join(os.homedir(), ".minecraft");
  }
}

export async function setupFirstJavaCheck(): Promise<void> {
  submitInfo(tr("FirstRun.Preparing"));
  let s = false;
  void (async () => {
    s = await waitJavaSearch();
  })();
  await waitInstDone();
  if (!s) {
    startInst("NoJava");
    await waitInstDone();
    if (os.platform() === "win32") {
      const j8 = await getLatestJREURL(true);
      const j16 = await getLatestJREURL(false);
      submitInfo(tr("FirstRun.FetchingJava"));
      await Promise.all([downloadJREInstaller(j8), downloadJREInstaller(j16)]);
      submitInfo(tr("FirstRun.InstallingJava"));
      await waitJREInstaller(j8);
      await waitJREInstaller(j16);
      await whereJava(true);
    } else {
      void shell.openExternal(
        "https://mirror.tuna.tsinghua.edu.cn/AdoptOpenJDK/16/jre/x64/linux/"
      );
      void shell.openExternal(
        "https://mirror.tuna.tsinghua.edu.cn/AdoptOpenJDK/8/jre/x64/linux/"
      );
      submitInfo(tr("JavaSelector.External"));
      return; // No following filtering
    }
  } else {
    startInst("JavaOK");
  }
  await whereJava(true);
  let a = "";
  submitInfo(tr("FirstRun.ConfiguringJava"));
  await Promise.allSettled(
    getAllJava().map(async (j) => {
      const jf = parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(j)));
      if (jf.rootVersion >= 16) {
        a = j;
      }
    })
  );
  setDefaultJavaHome(a || getAllJava()[0] || "");
  submitSucc(tr("FirstRun.JavaConfigured"));
}
