import EventEmitter from "events";

const PROGRESS_GATE = "PROGRESS";
const END_GATE = "END";

// Count how many objects has been resolved
// DO NOT use it to judge whether the operation has done!
// Use 'Promise' to do that

export class Progresser {
  private readonly emitter = new EventEmitter();

  total = 0;
  resolved = 0;

  markUpdate(msg = "", res = 1): void {
    this.resolved += res;
    this.emitter.emit(PROGRESS_GATE, this.resolved, this.total, msg);
    if (this.resolved >= this.total) {
      this.emitter.emit(END_GATE, msg);
    }
  }

  setResolved(msg = "", res = 0): void {
    this.resolved = res;
    this.emitter.emit(PROGRESS_GATE, this.resolved, this.total, msg);
    if (this.resolved >= this.total) {
      this.emitter.emit(END_GATE, msg);
    }
  }

  markEnd(msg: string): void {
    this.resolved = this.total;
    this.emitter.emit(PROGRESS_GATE, this.resolved, this.total, msg);
    this.emitter.emit(END_GATE, msg);
  }

  onProgress(
    fn: (resolved: number, total: number, msg?: string) => unknown
  ): void {
    this.emitter.on(PROGRESS_GATE, fn);
  }

  onEnd(fn: (msg: string) => unknown): void {
    this.emitter.on(END_GATE, fn);
  }

  constructor(total: number, startResolved = 0, emitter?: EventEmitter) {
    if (emitter !== undefined && emitter !== null) {
      this.emitter = emitter;
    }
    this.total = total;
    this.resolved = startResolved;
  }
}
