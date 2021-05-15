export function schedulePromiseTask<T>(
  fn: () => Promise<T>,
  timeout?: number
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // @ts-ignore
    window.requestIdleCallback(
      () => {
        fn()
          .then((r) => {
            resolve(r);
          })
          .catch((e) => {
            reject(e);
          });
      },
      timeout ? { timeout: timeout } : undefined
    );
  });
}
