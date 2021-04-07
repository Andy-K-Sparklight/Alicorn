import { ipcRenderer } from "electron";
import { SystemCall } from "../shared/Structures";
import { SYSTEM_CALL } from "../shared/Names";

export function callSystemSide(out: SystemCall): void {
  ipcRenderer.send(SYSTEM_CALL, out);
}
