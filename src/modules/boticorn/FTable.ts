// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function expose(obj: Record<string, any>): void {
  // @ts-ignore
  window._al_func_table = window._al_func_table || {};
  // @ts-ignore
  Object.assign(window._al_func_table, obj);
}
