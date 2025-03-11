export function hslToHex(str: string): string {
    const [hs, ss, ls] = str.split(" ");
    const h = parseFloat(hs);
    const s = parseFloat(ss.replaceAll("%", ""));
    const l = parseFloat(ls.replaceAll("%", "")) / 100;

    const a = s * Math.min(l, 1 - l) / 100;

    function fmt(n: number) {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, "0");   // convert to Hex and prefix "0" if needed
    }

    return `#${fmt(0)}${fmt(8)}${fmt(4)}`;
}

export function getEmptyImage() {
    return "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
}
