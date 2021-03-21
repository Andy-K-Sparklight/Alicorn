// NATIVE

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function getIpcRenderer() {
  return window["_alicorn_internal_ipc_renderer"];
}

export { getIpcRenderer };
