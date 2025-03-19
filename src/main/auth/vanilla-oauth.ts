import { getCanonicalUA } from "@/main/sys/ua";
import { windowControl } from "@/main/sys/window-control";
import { BrowserWindow } from "electron";
import { pEvent } from "p-event";

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

async function browserLogin(part: string, quiet = false): Promise<string> {
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

    let isShowing = false;

    w.webContents.session.setUserAgent(getCanonicalUA());

    w.webContents.on("did-stop-loading", () => {
        const url = URL.parse(w.webContents.getURL());

        if (url && url.hostname === "login.live.com" && url.pathname === "/oauth20_desktop.srf") {
            const rawCode = url.searchParams.get("code");
            const error = url.searchParams.get("error");

            if (rawCode) {
                code = decodeURIComponent(rawCode);
                w.close();
                return;
            }

            if (error) {
                w.close();
                return;
            }
        }

        if (!isShowing) {
            if (quiet) {
                // Not logged in, closing in quiet mode
                console.debug("The initial page does not contain the code and we are in quiet mode, closing.");
                w.close();
                isShowing = true; // Prevent timer from being called
            } else {
                // Show the window if we cannot extract the code at once
                console.debug("The initial page does not contain the code, showing for user interactions.");
                w.show();
                isShowing = true;
            }
        }
    });

    setTimeout(() => {
        if (!code && !isShowing) {
            if (quiet) {
                console.debug("Login timed out, closing window.");
                w.close();
            } else {
                // Show the window if the web page loads too slow
                console.debug("Login timed out, showing window.");
                w.show();
            }
        }
    }, 5000);

    void w.loadURL(OAUTH_URL);

    await pEvent(w, "close", { rejectionEvents: [] });

    return code;
}


export const vanillaOAuth = {
    browserLogin
};
