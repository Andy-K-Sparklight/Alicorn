import { StarlightVersion } from "./StarlightVersion";
import { mcbbsDeobf } from "./StarlightDeobf";
import { ElectronAdaptor } from "./ElectronAdaptor";
import { PageSwitchFix } from "./V3Fix";
import { initAlicornInvoke } from "./CallAlicorn";

console.log("Starlight started.");
console.log("Starlight by Andy K Rarity Sparklight with ❤~");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM is ready.");
  console.log("Attaching invocation messenger...");
  await initAlicornInvoke();
  if (window.location.host === "www.mcbbs.net") {
    console.log("MCBBS detected, running deobf...");
    new ElectronAdaptor().execute(document);
    mcbbsDeobf();
    console.log("Deobf completed, rendering.");
    new StarlightVersion().render(document);
    new PageSwitchFix().execute(document);
  }
});
