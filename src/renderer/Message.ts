export function submitError(msg: string): void {
  console.log(msg);
  window.dispatchEvent(new CustomEvent("sysError", { detail: msg }));
}
export function submitWarn(msg: string): void {
  window.dispatchEvent(new CustomEvent("sysWarn", { detail: msg }));
}
export function submitInfo(msg: string): void {
  window.dispatchEvent(new CustomEvent("sysInfo", { detail: msg }));
}
