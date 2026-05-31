import { useEffect, useState } from "react";

/**
 * Gets computed color values for HeroUI theme tokens.
 *
 * This is applied to recharts as it does not support TailwindCSS classes.
 */
export function useThemeColorValues(): { primary: string; background: string } {
    const [primary, setPrimary] = useState("#ffffff");
    const [background, setBackground] = useState("#333");

    useEffect(() => {
        const style = getComputedStyle(document.documentElement);

        setPrimary(style.getPropertyValue("--accent"));

        setBackground(style.getPropertyValue("--muted"));
    }, []);

    return { primary, background };
}
