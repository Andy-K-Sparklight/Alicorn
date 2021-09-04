export class WatchDog {
  timer: NodeJS.Timeout;
  constructor(timeout: number, action: () => unknown) {
    this.timer = setTimeout(action, timeout);
  }
  feed(): void {
    this.timer.refresh();
  }
  kill(): void {
    clearTimeout(this.timer);
  }
}

export class IntervalChecker {
  timer: NodeJS.Timer;
  constructor(interval: number, checker: () => unknown, action: () => unknown) {
    this.timer = setInterval(() => {
      if (!checker()) {
        action();
      }
    }, interval);
  }
  kill(): void {
    clearInterval(this.timer);
  }
}
