export function getWindow(): Window {
  // @ts-ignore
  return unsafeWindow || window;
}
