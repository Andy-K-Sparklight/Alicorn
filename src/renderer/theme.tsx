import type { ConfigTheme } from "@heroui/react";
import React, {
    type Dispatch,
    type PropsWithChildren,
    type SetStateAction,
    useContext,
    useEffect,
    useRef
} from "react";
import { useLocalStorage } from "react-use";
import themes from "~/themes";

function getThemes() {
    return ["light", "dark", ...Object.keys(themes)];
}

function isDark(th: string) {
    return (themes as Record<string, ConfigTheme>)[th]?.extend === "dark" || th === "dark";
}

interface ThemeContextContent {
    theme: string;
    setTheme: (theme: string) => void;
}

const ThemeContext = React.createContext<ThemeContextContent | null>(null);

export function useAutoTheme() {
    const { theme } = useTheme();
    const originalTheme = useRef<string | null>(null);

    useEffect(() => {
        if (originalTheme.current) {
            document.documentElement.classList.remove(originalTheme.current, "dark");
        }

        document.documentElement.classList.add(theme);
        if (isDark(theme)) {
            document.documentElement.classList.add("dark");
        }

        originalTheme.current = theme;
    }, [theme]);
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) throw "Cannot use theme hook outside the provider";

    return { theme: context.theme, setTheme: context.setTheme };
}

export function ThemeSwitchProvider({ children }: PropsWithChildren) {
    const [theme, setTheme] = useLocalStorage("theme", "dark") as [string, Dispatch<SetStateAction<string>>, () => void];

    return <ThemeContext.Provider value={{ theme, setTheme }}>
        {children}
    </ThemeContext.Provider>;
}

export const themeManager = { getThemes, isDark };
