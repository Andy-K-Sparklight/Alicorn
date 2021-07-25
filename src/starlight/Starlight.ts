import { AddMod } from "./AddMod";
import { AlicornCaller } from "./CallAlicorn";
import { ElectronAdaptor } from "./ElectronAdaptor";
import { getWindow } from "./GetWindow";
import { JoinServer } from "./JoinServer";
import { initMessenger } from "./Messenger";
import { NodeDetect } from "./NodeDetect";
import { mcbbsDeobf } from "./StarlightDeobf";
import { StarlightVersion } from "./StarlightVersion";

console.log("Starlight started.");
console.log("Starlight by Andy K Rarity Sparklight with ❤~");
let INIT_FLAG = 0;
document.addEventListener("DOMContentLoaded", async () => {
  if (INIT_FLAG === 1) {
    return;
  }
  INIT_FLAG = 1;
  console.log("DOM is ready.");
  console.log("Attaching invocation messenger...");
  try {
    await initMessenger();
    console.log("Alicorn Launcher found! Have fun!");
    console.log("Setting invoke module...");
    new AlicornCaller().execute(document);
  } catch {
    console.log(
      "Alicorn Launcher not found! Starlight's features will be limited."
    );
    console.log("Just start your Alicorn and Starlight should work fine!");
  }
  console.log("Executing Node.js warning module...");
  new NodeDetect().execute(document);
  if (getWindow().location.host === "www.mcbbs.net") {
    console.log("MCBBS detected, running deobf...");
    new ElectronAdaptor().execute(document);
    mcbbsDeobf();
    console.log("Deobf completed, rendering.");
    new StarlightVersion().render(document);
    console.log("Loading module JoinServer...");
    new JoinServer().execute(document);
    console.log("Loading module AddMod...");
    new AddMod().execute(document);
  }
});
