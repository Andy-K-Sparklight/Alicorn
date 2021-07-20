// ==UserScript==
// @name Starlight
// @namespace https://starlight.xuogroup.top/
// @version 1.0
// @run-at document-start
// @description Extend Alicorn features to web!
// @author Andy K Rarity Sparklight
// @match http*://**/*
// @grant unsafeWindow
// ==/UserScript==

/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/starlight/CallAlicorn.ts":
/*!**************************************!*\
  !*** ./src/starlight/CallAlicorn.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"invokeAlicorn\": () => (/* binding */ invokeAlicorn),\n/* harmony export */   \"AlicornCaller\": () => (/* binding */ AlicornCaller)\n/* harmony export */ });\n/* harmony import */ var _Component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Component */ \"./src/starlight/Component.ts\");\n/* harmony import */ var _GetWindow__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./GetWindow */ \"./src/starlight/GetWindow.ts\");\n/* harmony import */ var _Messenger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Messenger */ \"./src/starlight/Messenger.ts\");\n\n\n\nasync function invokeAlicorn(channel, ...args) {\n    return await (0,_Messenger__WEBPACK_IMPORTED_MODULE_0__.invoke)(channel, ...args);\n}\nclass AlicornCaller extends _Component__WEBPACK_IMPORTED_MODULE_1__.Executor {\n    execute(_document, ..._args) {\n        // @ts-ignore\n        (0,_GetWindow__WEBPACK_IMPORTED_MODULE_2__.getWindow)()[\"invokeAlicorn\"] = invokeAlicorn;\n    }\n}\n\n\n//# sourceURL=webpack:///./src/starlight/CallAlicorn.ts?");

/***/ }),

/***/ "./src/starlight/Component.ts":
/*!************************************!*\
  !*** ./src/starlight/Component.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"RenderAble\": () => (/* binding */ RenderAble),\n/* harmony export */   \"Executor\": () => (/* binding */ Executor)\n/* harmony export */ });\nclass RenderAble {\n    // eslint-disable-next-line no-empty-function\n    async prerender(document, ...args) { }\n}\nclass Executor {\n}\n\n\n//# sourceURL=webpack:///./src/starlight/Component.ts?");

/***/ }),

/***/ "./src/starlight/ElectronAdaptor.ts":
/*!******************************************!*\
  !*** ./src/starlight/ElectronAdaptor.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"ElectronAdaptor\": () => (/* binding */ ElectronAdaptor)\n/* harmony export */ });\n/* harmony import */ var _Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Component */ \"./src/starlight/Component.ts\");\n\nclass ElectronAdaptor extends _Component__WEBPACK_IMPORTED_MODULE_0__.Executor {\n    execute(document) {\n        // Rewrite open function to open in current window\n        /* This does not seem to work!\n        const openOld = window.open;\n        window.open = (\n          url?: string,\n          target?: string,\n          features?: string,\n          replace?: boolean\n        ): null => {\n          openOld(url, \"_self\", features, replace);\n          return null;\n        };\n        */\n        // Disable link open blank\n        document.querySelectorAll(\"a\").forEach((v) => {\n            v.target = \"_self\";\n        });\n    }\n}\n\n\n//# sourceURL=webpack:///./src/starlight/ElectronAdaptor.ts?");

/***/ }),

/***/ "./src/starlight/GetWindow.ts":
/*!************************************!*\
  !*** ./src/starlight/GetWindow.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"getWindow\": () => (/* binding */ getWindow)\n/* harmony export */ });\nfunction getWindow() {\n    // @ts-ignore\n    return unsafeWindow || window;\n}\n\n\n//# sourceURL=webpack:///./src/starlight/GetWindow.ts?");

/***/ }),

/***/ "./src/starlight/JoinServer.ts":
/*!*************************************!*\
  !*** ./src/starlight/JoinServer.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"JoinServer\": () => (/* binding */ JoinServer)\n/* harmony export */ });\n/* harmony import */ var _CallAlicorn__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CallAlicorn */ \"./src/starlight/CallAlicorn.ts\");\n/* harmony import */ var _Component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Component */ \"./src/starlight/Component.ts\");\n/* harmony import */ var _GetWindow__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./GetWindow */ \"./src/starlight/GetWindow.ts\");\n/* harmony import */ var _MCBBS__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./MCBBS */ \"./src/starlight/MCBBS.js\");\n\n\n\n\nfunction isServerPubPage() {\n    return (document.querySelector(\"tbody > tr:nth-child(1) > td.plc > div.pct > div > div.typeoption > table > caption\")?.innerHTML === \"服务器\");\n}\nfunction getSupportVersions() {\n    const c = document.querySelector(\"tbody > tr:nth-child(1) > td.plc > div.pct > div > div.typeoption > table > tbody > tr:nth-child(3) > td\");\n    return c ? c.innerHTML.split(\"&nbsp;\") : [];\n}\nfunction getServerAddress() {\n    const c = document.getElementById(\"server_ip\");\n    return c?.innerText || \"\";\n}\nasync function getCompatibleCores(versions) {\n    const allCores = (await (0,_CallAlicorn__WEBPACK_IMPORTED_MODULE_0__.invokeAlicorn)(\"GetAllInstalledCores\"));\n    const available = [];\n    for (const [c, vs] of Object.entries(allCores)) {\n        for (const v of vs) {\n            const r = (await (0,_CallAlicorn__WEBPACK_IMPORTED_MODULE_0__.invokeAlicorn)(\"GetCoreInfo\", c, v));\n            if (versions.includes(r.baseVersion)) {\n                available.push(r);\n            }\n        }\n    }\n    return available;\n}\nasync function openServer(serverAddress, container, id) {\n    await (0,_CallAlicorn__WEBPACK_IMPORTED_MODULE_0__.invokeAlicorn)(\"JumpTo\", `/ReadyToLaunch/${container}/${id}/${serverAddress}`, \"ReadyToLaunch\");\n}\nasync function isServerReachable(address) {\n    return !!(await (0,_CallAlicorn__WEBPACK_IMPORTED_MODULE_0__.invokeAlicorn)(\"TestServer\", address));\n}\nfunction attachJoinButton() {\n    const e = document.getElementById(\"server_ip_menu\");\n    if (e) {\n        e.innerHTML =\n            '<span style=\"color:#df307f;\"><b>在 Alicorn 中打开</b></span>';\n    }\n    const e2 = document.getElementById(\"server_ip\");\n    if (e2) {\n        e2.onclick = async () => {\n            (0,_MCBBS__WEBPACK_IMPORTED_MODULE_1__.showDialog)('Starlight 正在收集必要信息，请稍等，马上就好……<br/><i style=\"color:gray\">已经派出了 Spike，但他可能半路上遇到了 Rarity……</i>', \"info\", \"获取中……\");\n            const serverAddress = trimServerAddress(getServerAddress());\n            if (!(await isServerReachable(serverAddress))) {\n                if (!(await new Promise((resolve) => {\n                    (0,_MCBBS__WEBPACK_IMPORTED_MODULE_1__.showDialog)('Alicorn 报告此服务器不可达，无法连接。<br/>仍要尝试加入吗？<br/><i style=\"color:gray\">Twilight 未能打开传送门</i>', \"confirm\", \"无法使用该服务器\", () => {\n                        resolve(true);\n                    }, undefined, () => {\n                        resolve(false);\n                    }, \"\", \"仍要加入\", \"好\");\n                }))) {\n                    return;\n                }\n            }\n            const allCores = await getCompatibleCores(getSupportVersions());\n            if (allCores.length === 0) {\n                (0,_MCBBS__WEBPACK_IMPORTED_MODULE_1__.showDialog)('Alicorn 报告没有可用的核心，将无法启动游戏。<br/>请试着安装一个在支持版本中指定的核心。<br/><i style=\"color:gray\">这不是计划中的</i>', \"alert\", \"无可用核心\");\n                return;\n            }\n            if (allCores.length === 1) {\n                (0,_MCBBS__WEBPACK_IMPORTED_MODULE_1__.showDialog)('准备就绪，请转到 Alicorn，你的游戏在那里等你。<br/><i style=\"color:gray\">出发！</i>', \"right\", \"就绪\");\n                await openServer(serverAddress, allCores[0].container, allCores[0].id);\n                return;\n            }\n            (0,_GetWindow__WEBPACK_IMPORTED_MODULE_2__.getWindow)().addEventListener(\"selectCore\", async (e) => {\n                const s = e.detail;\n                (0,_MCBBS__WEBPACK_IMPORTED_MODULE_1__.showDialog)('准备就绪，请转到 Alicorn，你的游戏在那里等你。<br/><i style=\"color:gray\">出发！</i>', \"right\", \"就绪\");\n                await openServer(serverAddress, s.container, s.id);\n                return;\n            });\n            if (allCores.length > 1) {\n                const all = allCores\n                    .map((c) => {\n                    return `<span onclick=\"window.dispatchEvent(new CustomEvent('selectCore', {detail:{id:'${c.id}', container:'${c.container}'}}));\">${c.container}/${c.id}</span>`;\n                })\n                    .join(\"<br/>\");\n                (0,_MCBBS__WEBPACK_IMPORTED_MODULE_1__.showDialog)(`Alicorn 报告有不止一个可以运行的核心，单击以选择你想要使用的。<br/><span style=\"cursor:pointer;\">${all}</span><br/><i style=\"color:gray\">出发！</i>`, \"notice\", \"选择核心\");\n            }\n        };\n    }\n}\nfunction trimServerAddress(origin) {\n    if (!origin.includes(\":\")) {\n        return origin + \":25565\";\n    }\n    return origin;\n}\nclass JoinServer extends _Component__WEBPACK_IMPORTED_MODULE_3__.Executor {\n    execute(_document, ...args) {\n        if (isServerPubPage()) {\n            attachJoinButton();\n        }\n    }\n}\n\n\n//# sourceURL=webpack:///./src/starlight/JoinServer.ts?");

/***/ }),

/***/ "./src/starlight/Messenger.ts":
/*!************************************!*\
  !*** ./src/starlight/Messenger.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"initMessenger\": () => (/* binding */ initMessenger),\n/* harmony export */   \"invoke\": () => (/* binding */ invoke)\n/* harmony export */ });\nlet WEBSOCKET_CLIENT = null;\nconst TSS = new Map();\nlet cEvent = 0;\nasync function initMessenger() {\n    // Detect Electron\n    return new Promise((resolve) => {\n        // Alicorn/Starlight uses port 16814 to exchange data\n        WEBSOCKET_CLIENT = new WebSocket(\"ws://localhost:16814/\");\n        WEBSOCKET_CLIENT.onerror = (e) => {\n            console.log(e);\n            resolve();\n        };\n        WEBSOCKET_CLIENT.onopen = () => {\n            console.log(\"OPENED: Starlight <============> Alicorn\");\n            resolve();\n        };\n        WEBSOCKET_CLIENT.onclose = () => {\n            console.log(\"CLOSED: Starlight <            > Alicorn\");\n        };\n        // WebSocket can only transfer string\n        // Send back string -> Object\n        // { eid: <Task id>, value: <any>}\n        WEBSOCKET_CLIENT.onmessage = (e) => {\n            const data = JSON.parse(String(e.data));\n            if (typeof data.eid === \"number\") {\n                const f = TSS.get(data.eid);\n                TSS.delete(data.eid);\n                if (typeof f === \"function\") {\n                    f(data.value);\n                }\n            }\n        };\n    });\n}\nasync function invoke(channel, ...args) {\n    const taskId = ++cEvent;\n    WEBSOCKET_CLIENT?.send(JSON.stringify({\n        eid: taskId,\n        channel: channel,\n        args: args,\n    }));\n    return new Promise((resolve) => {\n        TSS.set(taskId, resolve);\n    });\n}\n\n\n//# sourceURL=webpack:///./src/starlight/Messenger.ts?");

/***/ }),

/***/ "./src/starlight/NodeDetect.ts":
/*!*************************************!*\
  !*** ./src/starlight/NodeDetect.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"NodeDetect\": () => (/* binding */ NodeDetect)\n/* harmony export */ });\n/* harmony import */ var _Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Component */ \"./src/starlight/Component.ts\");\n/* harmony import */ var _GetWindow__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./GetWindow */ \"./src/starlight/GetWindow.ts\");\n\n\nclass NodeDetect extends _Component__WEBPACK_IMPORTED_MODULE_0__.Executor {\n    execute(document, ...args) {\n        document.body.insertAdjacentHTML(\"afterbegin\", `<div id=\"node_warning\" style='position: fixed;width: 100%;height: 30px;bottom: 0;left: 0;right: 0;text-align: center;display: none;background-color: red;z-index: 999'><span style='font-family: \"Microsoft YaHei UI Light\", Tahoma, Verdana, sans-serif;font-size: 14px;height: 30px;display: inline;color: white'>此页面启用了 Node.js 集成，可以直接访问您的计算机，请确保您信任该站点！(<span id=\"node_warning_timer\">5</span>s)</div>`);\n        // @ts-ignore\n        (0,_GetWindow__WEBPACK_IMPORTED_MODULE_1__.getWindow)()[\"reportNodeFunction\"] = () => {\n            const a = document.getElementById(\"node_warning\");\n            if (a) {\n                a.style.display = \"unset\";\n            }\n        };\n        let current = 5;\n        const pid = setInterval(() => {\n            const b = document.getElementById(\"node_warning_timer\");\n            if (b) {\n                b.innerHTML = (--current).toString();\n            }\n            if (current <= 0) {\n                const a = document.getElementById(\"node_warning\");\n                if (a) {\n                    a.style.display = \"none\";\n                }\n                clearInterval(pid);\n            }\n        }, 1000);\n        const scr = document.createElement(\"script\");\n        scr.setAttribute(\"type\", \"text/javascript\");\n        scr.innerText = `console.log(\"Testing Node.js features...\");try{if(require(\"electron\")){window.reportNodeFunction();console.log(\"Node.js found! It should be used wisely.\")}}catch{console.log(\"No Node.js found. Whew...\");}`;\n        scr.onload = () => {\n            scr.parentNode?.removeChild(scr);\n        };\n        document.head.appendChild(scr);\n    }\n}\n\n\n//# sourceURL=webpack:///./src/starlight/NodeDetect.ts?");

/***/ }),

/***/ "./src/starlight/Starlight.ts":
/*!************************************!*\
  !*** ./src/starlight/Starlight.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _CallAlicorn__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./CallAlicorn */ \"./src/starlight/CallAlicorn.ts\");\n/* harmony import */ var _ElectronAdaptor__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./ElectronAdaptor */ \"./src/starlight/ElectronAdaptor.ts\");\n/* harmony import */ var _GetWindow__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./GetWindow */ \"./src/starlight/GetWindow.ts\");\n/* harmony import */ var _JoinServer__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./JoinServer */ \"./src/starlight/JoinServer.ts\");\n/* harmony import */ var _Messenger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Messenger */ \"./src/starlight/Messenger.ts\");\n/* harmony import */ var _NodeDetect__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./NodeDetect */ \"./src/starlight/NodeDetect.ts\");\n/* harmony import */ var _StarlightDeobf__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./StarlightDeobf */ \"./src/starlight/StarlightDeobf.ts\");\n/* harmony import */ var _StarlightVersion__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./StarlightVersion */ \"./src/starlight/StarlightVersion.ts\");\n\n\n\n\n\n\n\n\nconsole.log(\"Starlight started.\");\nconsole.log(\"Starlight by Andy K Rarity Sparklight with ❤~\");\ndocument.addEventListener(\"DOMContentLoaded\", async () => {\n    console.log(\"DOM is ready.\");\n    console.log(\"Attaching invocation messenger...\");\n    await (0,_Messenger__WEBPACK_IMPORTED_MODULE_0__.initMessenger)();\n    console.log(\"Setting invoke module...\");\n    new _CallAlicorn__WEBPACK_IMPORTED_MODULE_1__.AlicornCaller().execute(document);\n    console.log(\"Executing Node.js warning module...\");\n    new _NodeDetect__WEBPACK_IMPORTED_MODULE_2__.NodeDetect().execute(document);\n    if ((0,_GetWindow__WEBPACK_IMPORTED_MODULE_3__.getWindow)().location.host === \"www.mcbbs.net\") {\n        console.log(\"MCBBS detected, running deobf...\");\n        new _ElectronAdaptor__WEBPACK_IMPORTED_MODULE_4__.ElectronAdaptor().execute(document);\n        (0,_StarlightDeobf__WEBPACK_IMPORTED_MODULE_5__.mcbbsDeobf)();\n        console.log(\"Deobf completed, rendering.\");\n        new _StarlightVersion__WEBPACK_IMPORTED_MODULE_6__.StarlightVersion().render(document);\n        console.log(\"Loading module JoinServer...\");\n        new _JoinServer__WEBPACK_IMPORTED_MODULE_7__.JoinServer().execute(document);\n    }\n});\n\n\n//# sourceURL=webpack:///./src/starlight/Starlight.ts?");

/***/ }),

/***/ "./src/starlight/StarlightDeobf.ts":
/*!*****************************************!*\
  !*** ./src/starlight/StarlightDeobf.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"mcbbsDeobf\": () => (/* binding */ mcbbsDeobf),\n/* harmony export */   \"isV3\": () => (/* binding */ isV3)\n/* harmony export */ });\nfunction mcbbsDeobf() {\n    const IS_V3 = isV3();\n    if (!IS_V3) {\n        console.log(\"V2 UI detected.\");\n        // Top\n        const topBarLinks = document.querySelector(\"#toptb > div > div.z.light\");\n        if (topBarLinks) {\n            topBarLinks.id = \"top_bar_links\";\n        }\n        console.log(\"Patched ID: top_bar_links\");\n    }\n    else {\n        console.log(\"V3 UI detected.\");\n        // Patch debug info\n        const debugInfo = document.querySelector(\"#footer > div.uix_extendedFooter > div > div > div:nth-child(4) > div\");\n        if (debugInfo) {\n            debugInfo.id = \"debuginfo\";\n        }\n        console.log(\"Patched ID: debuginfo\");\n    }\n}\nfunction isV3() {\n    const rs = document\n        .querySelector(\"#footer > div.uix_extendedFooter > div > div > div:nth-child(4) > div > h3\")\n        ?.innerHTML?.includes(\"X3.5\");\n    return rs === undefined ? false : rs;\n}\n\n\n//# sourceURL=webpack:///./src/starlight/StarlightDeobf.ts?");

/***/ }),

/***/ "./src/starlight/StarlightVersion.ts":
/*!*******************************************!*\
  !*** ./src/starlight/StarlightVersion.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"StarlightVersion\": () => (/* binding */ StarlightVersion)\n/* harmony export */ });\n/* harmony import */ var _Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Component */ \"./src/starlight/Component.ts\");\n/* harmony import */ var _StarlightDeobf__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./StarlightDeobf */ \"./src/starlight/StarlightDeobf.ts\");\n\n\nconst VERSION = \"Experimental 0.1\";\nclass StarlightVersion extends _Component__WEBPACK_IMPORTED_MODULE_0__.RenderAble {\n    render(document) {\n        document\n            .getElementById(\"debuginfo\")\n            ?.insertAdjacentHTML(\"afterend\", `<span>Starlight ${VERSION}</span>`);\n        if ((0,_StarlightDeobf__WEBPACK_IMPORTED_MODULE_1__.isV3)()) {\n            document\n                .querySelector(\"#top > div.p-body > div.uix_sidebarNav > div.uix_sidebarNav__inner.uix_stickyBodyElement > div > ul\")\n                ?.insertAdjacentHTML(\"beforeend\", `<li class=\"uix_sidebarNavList__listItem\"><div class=\"p-navEl\"><div><a class=\"p-navEl-link p-navEl-link--splitMenu\"><i class=\"fas fa-magic\"></i><span>Starlight Powered</span></a></div></div></li>`);\n            document\n                .querySelector(\"#top > div.offCanvasMenu.offCanvasMenu--nav.js-headerOffCanvasMenu.is-active > div.offCanvasMenu-content > div.sidePanel.sidePanel--nav.sidePanel--visitor > div > div > div.js-offCanvasNavTarget > ul\")\n                ?.insertAdjacentHTML(\"beforeend\", `<li><div class=\"offCanvasMenu-linkHolder\"><a class=\"offCanvasMenu-link\"><span>Starlight Powered</span></a></div><ul class=\"offCanvasMenu-subList\"></ul></li>`);\n        }\n        else {\n            document\n                .getElementById(\"top_bar_links\")\n                ?.insertAdjacentHTML(\"beforeend\", \"<a>Starlight Powered</a>\");\n        }\n    }\n}\n\n\n//# sourceURL=webpack:///./src/starlight/StarlightVersion.ts?");

/***/ }),

/***/ "./src/starlight/MCBBS.js":
/*!********************************!*\
  !*** ./src/starlight/MCBBS.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"showDialog\": () => (/* binding */ showDialog),\n/* harmony export */   \"showError\": () => (/* binding */ showError)\n/* harmony export */ });\nfunction showDialog(...args) {\n  (unsafeWindow || window).showDialog(...args);\n}\n\nfunction showError(...args) {\n  (unsafeWindow || window).showError(...args);\n}\n\n\n//# sourceURL=webpack:///./src/starlight/MCBBS.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/starlight/Starlight.ts");
/******/ 	
/******/ })()
;