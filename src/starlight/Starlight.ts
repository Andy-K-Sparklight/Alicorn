import { AlicornCaller, initAlicornInvoke } from "./CallAlicorn";
import { ElectronAdaptor } from "./ElectronAdaptor";
import { NodeDetect } from "./NodeDetect";
import { mcbbsDeobf } from "./StarlightDeobf";
import { StarlightVersion } from "./StarlightVersion";

console.log("Starlight started.");
console.log("Starlight by Andy K Rarity Sparklight with ❤~");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM is ready.");
  console.log("Attaching invocation messenger...");
  await initAlicornInvoke();
  console.log("Setting invoke module...");
  new AlicornCaller().execute(document);
  console.log("Executing Node.js warning module...");
  new NodeDetect().execute(document);
  if (window.location.host === "www.mcbbs.net") {
    console.log("MCBBS detected, running deobf...");
    new ElectronAdaptor().execute(document);
    mcbbsDeobf();
    console.log("Deobf completed, rendering.");
    new StarlightVersion().render(document);
  }
});
