import _safeEval from "safe-eval";

// NATIVES

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function safeEval(exp) {
  return _safeEval(exp);
}
