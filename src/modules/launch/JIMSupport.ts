import { getActualDataPath, saveDefaultData } from "../config/DataSupport";
import childProcess from "child_process";

export async function saveJIMFile(): Promise<void> {
  await saveDefaultData("jim.vbs");
}

export async function runJIM(): Promise<void> {
  const ps1 = childProcess.exec(`"${getActualDataPath("jim.vbs")}"`);
  const t1 = setTimeout(() => {
    ps1.kill("SIGKILL");
  }, 10000);
  ps1.on("exit", () => {
    clearTimeout(t1);
  });
}
