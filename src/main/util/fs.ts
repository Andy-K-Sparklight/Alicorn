export function isENOENT(e: unknown): boolean {
    return typeof e === "object" && e !== null && "code" in e && e.code === "ENOENT";
}
