import { Executor } from "./Component";

export class NodeWarning extends Executor {
  execute(document: Document, ...args: unknown[]): void {
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<div id="node_warning" style='position: fixed;width: 100%;height: 30px;bottom: 0;left: 0;right: 0;text-align: center;display: none;background-color: red;z-index: 999'><span style='font-family: "Microsoft YaHei UI Light", Tahoma, Verdana, sans-serif;font-size: 14px;height: 30px;display: inline;color: white'>此页面启用了 Node.js 集成，可以直接访问您的计算机，请确保您信任该站点！(<span id="node_warning_timer">5</span>s)</div>`
    );
    // @ts-ignore
    window["reportNodeFunction"] = () => {
      const a = document.getElementById("node_warning");
      if (a) {
        a.style.display = "unset";
      }
    };
    let current = 5;
    const pid = setInterval(() => {
      const b = document.getElementById("node_warning_timer");
      if (b) {
        b.innerHTML = (--current).toString();
      }
      if (current <= 0) {
        const a = document.getElementById("node_warning");
        if (a) {
          a.style.display = "none";
        }
        clearInterval(pid);
      }
    }, 1000);
    const scr = document.createElement("script");
    scr.setAttribute("type", "text/javascript");
    scr.innerText = `console.log("Testing Node.js features...");try{if(require("electron")){window.reportNodeFunction();console.log("Node.js found! It should be used wisely.")}}catch{console.log("No Node.js found. Whew...");}`;
    scr.onload = () => {
      scr.parentNode?.removeChild(scr);
    };
    document.head.appendChild(scr);
  }
}
