import { submitInfo } from "../../renderer/Renderer";
import { registerCommand } from "./CommandListener";

// Alicorn Shell
export function initBase(): void {
  registerCommand("echo", (a) => {
    submitInfo(a.join(" "));
  });
  registerCommand("dargs", (a) => {
    submitInfo(a.join("/"));
  });
}
