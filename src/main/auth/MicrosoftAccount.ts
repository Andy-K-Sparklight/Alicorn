import { Account } from "./Account";
import { Trio } from "../commons/Collections";
import { BrowserWindow } from "electron";

const LOGIN_START =
  "https://login.live.com/oauth20_authorize.srf?client_id=00000000402b5328&response_type=code&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf";
let window: BrowserWindow | null = null;
const CODE_REGEX = /(?<=\?code=)[^&]+/gi;
const ERROR_REGEX = /(?<=\?error=)[^&]+/gi;
const ERROR_DESCRIPTION = /(?<=&error_description=)[^&]+/gi;

export class MicrosoftAccount extends Account {
  async buildAccessData(): Promise<Trio<string, string, string>> {
    return new Trio<string, string, string>(
      this.lastUsedUsername,
      this.lastUsedAccessToken,
      this.lastUsedUUID
    );
  }

  flushToken(): Promise<boolean> {
    return Promise.resolve(false);
  }

  getAccountIdentifier(): string {
    return "";
  }

  isAccessTokenValid(): Promise<boolean> {
    return Promise.resolve(false);
  }

  performAuth(password: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  serialize(): string {
    return "";
  }

  refreshToken = "";
}

export async function browserGetCode(): Promise<string> {
  let sCode = "";
  console.log("Building login window...");
  window = new BrowserWindow({
    frame: false,
    width: 960,
    height: 540,
    show: false,
  });
  await window.loadURL(LOGIN_START);
  return new Promise<string>((resolve, reject) => {
    window?.on("close", () => {
      if (sCode === "") {
        console.log("Unexpected window closing, what have you done?");
        reject();
      }
    });
    window?.webContents.on("did-stop-loading", () => {
      const url = window?.webContents.getURL();
      if (url?.startsWith("https://login.live.com/oauth20_desktop.srf")) {
        if (CODE_REGEX.test(url)) {
          console.log("Code found. Closing login window.");
          sCode = unescape((url.match(CODE_REGEX) || [])[0] || "");
          window?.close();
          resolve(sCode);
          return;
        }
        if (ERROR_REGEX.test(url)) {
          sCode = "NOT FOUND";
          console.log(
            "Error during login: " +
              unescape((url.match(ERROR_REGEX) || [])[0] || "")
          );
          console.log(
            "Caused by: " +
              unescape((url.match(ERROR_DESCRIPTION) || [])[0] || "")
          );
        }
        console.log("Error occurred. Closing login window.");
        window?.close();
        reject();
      } else {
        console.log("Not a callback URL, showing window...");
        window?.show();
      }
    });
  });
}
