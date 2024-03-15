import os from "os";
import path from "path";

export function getOSSpecificDataDir(): string {
    switch (os.platform()) {
        case "win32":
            return path.join(os.homedir(), "AppData", "Local", "Alicorn");
        default:
            return path.join(os.homedir(), ".alicorn");
    }
}
