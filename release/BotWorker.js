/*! For license information please see BotWorker.js.LICENSE.txt */
(()=>{var __webpack_exports__={};onmessage=async e=>{if(e.data.init)return eval("require")(e.data.init),void postMessage([e.data.eid,e.data.init]);{let a=await globalThis.nlp_process(e.data[1]);postMessage([e.data[0],a])}}})();