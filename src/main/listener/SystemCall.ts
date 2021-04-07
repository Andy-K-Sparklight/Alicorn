import { ipcMain } from "electron";
import { SYSTEM_CALL } from "../../shared/Names";
import { SystemCall, SystemCommand } from "../../shared/Structures";
import { getMainWindow } from "../Main";

export function registerSystemCall(): void {
  ipcMain.on(SYSTEM_CALL, (e, c: SystemCall) => {
    switch (c.command) {
      case SystemCommand.CloseWindow:
        closeWindow();
    }
  });
}

function closeWindow(): void {
  getMainWindow()?.close();
}
