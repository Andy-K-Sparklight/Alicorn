export class WatchDog {
    timer: NodeJS.Timeout;
    action: () => unknown;
    timeout: number;

    constructor(timeout: number, action: () => unknown) {
        this.timer = setTimeout(action, timeout);
        this.action = action;
        this.timeout = timeout;
    }

    feed(): void {
        if (this.timer.refresh) {
            this.timer.refresh();
        } else {
            clearTimeout(this.timer);
            this.timer = setTimeout(this.action, this.timeout);
        }
    }

    kill(): void {
        clearTimeout(this.timer);
    }
}
