// Pair: 2 values
export class Pair<T1, T2> {
  private v1: T1;
  private v2: T2;

  constructor(v1: T1, v2: T2) {
    this.v1 = v1;
    this.v2 = v2;
  }

  setFirstValue(v: T1): void {
    this.v1 = v;
  }

  setSecondValue(v: T2): void {
    this.v2 = v;
  }

  getFirstValue(): T1 {
    return this.v1;
  }

  getSecondValue(): T2 {
    return this.v2;
  }

  set(v: [T1, T2]): void {
    this.v1 = v[0];
    this.v2 = v[1];
  }

  get(): [T1, T2] {
    return [this.v1, this.v2];
  }
}

// Trio: 3 values
export class Trio<T1, T2, T3> {
  private v1: T1;
  private v2: T2;
  private v3: T3;

  constructor(v1: T1, v2: T2, v3: T3) {
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;
  }

  setFirstValue(v: T1): void {
    this.v1 = v;
  }

  setSecondValue(v: T2): void {
    this.v2 = v;
  }

  setThirdValue(v: T3): void {
    this.v3 = v;
  }

  getFirstValue(): T1 {
    return this.v1;
  }

  getSecondValue(): T2 {
    return this.v2;
  }

  getThirdValue(): T3 {
    return this.v3;
  }

  set(v: [T1, T2, T3]): void {
    this.v1 = v[0];
    this.v2 = v[1];
    this.v3 = v[2];
  }

  get(): [T1, T2, T3] {
    return [this.v1, this.v2, this.v3];
  }
}

