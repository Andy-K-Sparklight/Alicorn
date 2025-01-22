import type { ConfigTheme } from "@heroui/react";
import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";
import { useLocalStorage } from "react-use";
import themes from "~/themes";

function getThemes() {
    return ["light", "dark", ...Object.keys(themes)];
}

function isDark(th: string) {
    return (themes as Record<string, ConfigTheme>)[th]?.extend === "dark" || th === "dark";
}

export function useTheme() {
    const [theme, setTheme] = useLocalStorage("theme", "dark") as [string, Dispatch<SetStateAction<string>>, () => void];
    const originalTheme = useRef<string | null>(null);

    useEffect(() => {
        if (originalTheme.current) {
            document.documentElement.classList.remove(originalTheme.current, "dark");
        }

        console.log(`Adding theme: ${theme}`);
        document.documentElement.classList.add(theme);
        if (isDark(theme)) {
            document.documentElement.classList.add("dark");
        }

        originalTheme.current = theme;
    }, [theme]);

    return { theme, setTheme };
}

export const themeManager = { getThemes, isDark };
