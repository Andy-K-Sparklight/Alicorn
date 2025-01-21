type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T;

export function isNonNull<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined;
}

export function isTruthy<T>(value: T): value is Truthy<T> {
    return !!value;
}
