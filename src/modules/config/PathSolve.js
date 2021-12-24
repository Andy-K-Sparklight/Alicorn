// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getBasePath() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const electron = require("electron");
  if (typeof electron.app === "undefined") {
    return electron.ipcRenderer.sendSync("getAppPath");
  } else {
    return electron.app.getAppPath();
  }
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getMainExecutable() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const electron = require("electron");
  if (typeof electron.app === "undefined") {
    return electron.ipcRenderer.sendSync("getMainExecutable");
  } else {
    return electron.app.getPath("exe");
  }
}
