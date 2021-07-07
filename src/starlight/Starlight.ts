import { StarlightVersion } from "./StarlightVersion";
import { mcbbsDeobf } from "./StarlightDeobf";
import { ElectronAdaptor } from "./ElectronAdaptor";
import { initAlicornInvoke } from "./CallAlicorn";
import { NodeWarning } from "./NodeWarning";

console.log("Starlight started.");
console.log("Starlight by Andy K Rarity Sparklight with ❤~");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM is ready.");
  console.log("Attaching invocation messenger...");
  await initAlicornInvoke();
  console.log("Executing Node.js warning module...");
  new NodeWarning().execute(document);
  if (window.location.host === "www.mcbbs.net") {
    console.log("MCBBS detected, running deobf...");
    new ElectronAdaptor().execute(document);
    mcbbsDeobf();
    console.log("Deobf completed, rendering.");
    new StarlightVersion().render(document);
  }
});
