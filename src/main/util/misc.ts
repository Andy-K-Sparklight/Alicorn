type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T;

export function isTruthy<T>(value: T): value is Truthy<T> {
    return !!value;
}

/**
 * Clones the given object, modify it with the given function, then return the cloned  object.
 */
export function alter<T>(obj: T, fn: (o: T) => void): T {
    const o = structuredClone(obj);
    fn(o);
    return o;
}

/**
 * Removes duplicates from the given array based on the given key selector.
 */
export function uniqueBy<T>(arr: T[], keySelector?: (o: T) => unknown): T[] {
    return Array.from(new Map(arr.map(o => [keySelector ? keySelector(o) : o, o])).values());
}
