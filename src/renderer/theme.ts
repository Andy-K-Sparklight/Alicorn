import { isTruthy } from "@/main/util/misc";
import type { ConfigTheme } from "@heroui/react";
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "react-use";
import themes from "~/themes";

function getThemes() {
    return ["light", "dark", ...Object.keys(themes)];
}

function isDark(th: string) {
    return (themes as Record<string, ConfigTheme>)[th]?.extend === "dark" || th === "dark";
}

export function useTheme() {
    useState();
    const [theme, setTheme] = useLocalStorage("theme", "dark") as [string, Dispatch<SetStateAction<string>>, () => void];
    const originalTheme = useRef(theme);

    useEffect(() => {
        const clazz = [theme, isDark(theme) && "dark"].filter(isTruthy);
        document.documentElement.classList.remove(originalTheme.current, "dark");
        document.documentElement.classList.add(...clazz);
        originalTheme.current = theme;
    }, [theme]);

    return { theme, setTheme };
}

export const themeManager = { getThemes, isDark };
