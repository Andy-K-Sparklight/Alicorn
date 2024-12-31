import { BrowserWindow } from "electron";
import { bwctl } from "@/main/sys/bwctl";

const oAuthUrl =
    "https://login.live.com/oauth20_authorize.srf" +
    "?client_id=00000000402b5328" +
    "&response_type=code" +
    "&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL" +
    "&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf";


async function browserLogin(part: string): Promise<string> {
    const [width, height] = bwctl.optimalSize();

    const w = new BrowserWindow({
        width, height,
        frame: false,
        show: false,
        webPreferences: {
            partition: `persist:${part}`
        }
    });

    let code = "";

    return new Promise((res) => {
        w.once("close", () => res(code));

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
            w.loadURL(oAuthUrl),
            new Promise(res => setTimeout(res, 5000))
        ]).finally(() => w.show());
    });
}


export const msAuth = {
    browserLogin
};