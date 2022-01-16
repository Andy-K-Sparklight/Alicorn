onmessage = async (e) => {
  if (e.data.init) {
    eval("require")(e.data.init);
    postMessage([e.data.eid, e.data.init]);
    return;
  } else {
    let ans = await globalThis.nlp_process(e.data[1]);
    postMessage([e.data[0], ans]);
  }
};
