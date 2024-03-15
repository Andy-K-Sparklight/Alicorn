type AllocateOrder<T> = (t: T) => void;

export class Cluster<T> {
    protected idle: Set<T> = new Set();
    protected inUse: Set<T> = new Set();
    protected orders: AllocateOrder<T>[] = [];
    protected builder: (i: number) => T;

    constructor(builder: (i: number) => T, count: number) {
        this.builder = builder;
        for (let i = 0; i < count; i++) {
            this.idle.add(builder(i));
        }
    }

    // Free the instance
    free(t: T | null): void {
        if (t) {
            this.inUse.delete(t);
            this.idle.add(t);
            this.notifyAll();
        }
    }

    protected _use(t: T): void {
        this.idle.delete(t);
        this.inUse.add(t);
    }

    protected notifyAll(): void {
        let t: T | null;
        while (this.orders.length > 0 && (t = this._allocate()) !== null) {
            this._use(t);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.orders.shift()!(t);
        }
    }

    protected _allocate(): T | null {
        if (this.idle.size <= 0) {
            return null;
        }
        return this.idle.values().next().value || null;
    }

    // Allocate new instance, one instance once.
    allocate(): Promise<T> {
        const p = this._allocate();
        if (p) {
            this._use(p);
            return Promise.resolve(p);
        }
        return new Promise<T>((res) => {
            this.orders.push(res);
        });
    }

    // Create more instances
    create(count: number): void {
        for (let i = 0; i < count; i++) {
            this.idle.add(this.builder(i));
        }
        this.notifyAll();
    }

    // Discard an instance, remove it from the cluster.
    // Make sure that this instance has been freed! Or this function will do nothing.
    discard(t: T): void {
        this.idle.delete(t);
    }

    // Discard all, and drop all instances
    drop(): T[] {
        const oset: Set<T> = new Set();
        this.inUse.forEach((x) => {
            oset.add(x);
        });
        this.idle.forEach((x) => {
            oset.add(x);
        });
        this.inUse.clear();
        this.idle.clear();
        const p0 = [...oset];
        oset.clear();
        return p0;
    }
}
