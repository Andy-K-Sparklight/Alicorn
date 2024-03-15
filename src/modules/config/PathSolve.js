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
