import { windowControl } from "@/main/sys/window-control";
import { BrowserWindow } from "electron";
import { pEvent } from "p-event";
import timers from "timers/promises";

const OAUTH_URL = createOAuthUrl();

function createOAuthUrl() {
    const u = new URL("https://login.live.com/oauth20_authorize.srf");
    const sp = u.searchParams;
    sp.append("client_id", "00000000402b5328");
    sp.append("response_type", "code");
    sp.append("scope", "service::user.auth.xboxlive.com::MBI_SSL");
    sp.append("redirect_uri", "https://login.live.com/oauth20_desktop.srf");
    return u.toString();
}

async function browserLogin(part: string): Promise<string> {
    const [width, height] = windowControl.optimalSize();

    const w = new BrowserWindow({
        width, height,
        frame: false,
        show: false,
        webPreferences: {
            partition: `persist:${part}`
        }
    });

    let code = "";

    w.webContents.on("did-stop-loading", () => {
        const url = w.webContents.getURL();
        const rawCode = URL.parse(url)?.searchParams.get("code");

        if (rawCode) {
            code = decodeURIComponent(rawCode);
            w.close();
        }
    });

    // Wait for the content to load for no more than 5s
    Promise.race([
        w.loadURL(OAUTH_URL),
        timers.setTimeout(5000)
    ]).finally(() => w.show());

    await pEvent(w, "close");

    return code;
}


export const vanillaOAuth = {
    browserLogin
};
