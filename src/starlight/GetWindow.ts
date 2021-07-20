export function getWindow(): Window {
  try {
    // @ts-ignore
    return unsafeWindow;
  } catch {
    return window;
  }
}
