import { Executor } from "./Component";

export class ElectronAdaptor extends Executor {
  execute(document: Document): void {
    // Rewrite open function to open in current window
    /* This does not seem to work!
    const openOld = window.open;
    window.open = (
      url?: string,
      target?: string,
      features?: string,
      replace?: boolean
    ): null => {
      openOld(url, "_self", features, replace);
      return null;
    };
    */

    // Disable link open blank
    document.querySelectorAll("a").forEach((v) => {
      v.target = "_self";
    });
  }
}
