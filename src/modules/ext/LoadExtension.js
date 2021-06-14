// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function loadExtensionDangerously(pt) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = eval("require")(pt);
  if (typeof m.id !== "string" || typeof m.name !== "string") {
    return null;
  }
  if (typeof m.priority !== "number") {
    m.priority = 0;
  }
  if (!(m.mixins instanceof Array)) {
    m.mixins = [];
  }
  const om = [];
  for (const t of m.mixins) {
    if (isMixin(t)) {
      om.push(t);
    }
  }
  m.mixins = om;
  return m;
}

function isMixin(a) {
  return (
    typeof a.target === "string" &&
    ["BeforeEnd", "AfterEnd", "BeforeStart", "AfterStart"].includes(a.type) &&
    typeof a.executor === "function"
  );
}
