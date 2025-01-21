import { isTruthy } from "@/main/util/misc";
import type { ConfigTheme } from "@heroui/react";
import { useEffect, useRef } from "react";
import { useLocalStorage } from "react-use";
import themes from "~/themes";

function getThemes() {
    return ["light", "dark", ...Object.keys(themes)];
}

function isDark(th: string) {
    return (themes as Record<string, ConfigTheme>)[th]?.extend === "dark" || th === "dark";
}

export function useTheme() {
    const [theme, setTheme] = useLocalStorage("theme", "dark");
    const t = theme ?? "dark";
    const originalTheme = useRef(t);

    useEffect(() => {
        const clazz = [theme, isDark(t) && "dark"].filter(isTruthy);
        document.documentElement.classList.remove(originalTheme.current, "dark");
        document.documentElement.classList.add(...clazz);
    }, [theme]);

    return { theme, setTheme };
}

export const themeManager = { getThemes, isDark };
