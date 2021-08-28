import { ipcMain } from "electron";
import { Server } from "ws";
import { getMainWindow } from "./Bootstrap";

let WS_SERVER: Server;
export function initWS(): void {
  WS_SERVER = new Server({ port: 16814 });
  WS_SERVER.on("connection", (ws) => {
    console.log("OPENED: Alicorn <============> Starlight");
    ws.on("message", (msg) => {
      const data = JSON.parse(msg.toString());
      getMainWindow()?.webContents.send(
        data.channel + "_A_MAIN",
        data.eid,
        data.args || []
      );
      ipcMain.once(data.channel + "_A_MAIN" + data.eid, (_e, result) => {
        ws.send(
          JSON.stringify({
            eid: data.eid,
            value: result,
          })
        );
      });
    });
    ws.on("close", () => {
      console.log("CLOSED: Alicorn <            > Starlight");
    });
  });
}
export function closeWS(): void {
  WS_SERVER.close();
}
