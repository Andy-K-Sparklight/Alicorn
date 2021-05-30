import { StarlightVersion } from "./StarlightVersion";
import { mcbbsDeobf } from "./StarlightDeobf";
import { ElectronAdaptor } from "./ElectronAdaptor";

console.log("Starlight started.");
console.log("Starlight by Andy K Rarity Sparklight with ❤~");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM is ready.");
  if (window.location.host === "www.mcbbs.net") {
    console.log("MCBBS detected, running deobf...");
    new ElectronAdaptor().execute(document);
    mcbbsDeobf();
    console.log("Deobf completed, rendering.");
    new StarlightVersion().render(document);
    console.log("Checking Node.js status...");
  }
});
