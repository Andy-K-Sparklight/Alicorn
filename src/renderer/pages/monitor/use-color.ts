import { hslToHex } from "@/renderer/util/misc";
import { useEffect, useState } from "react";

/**
 * Gets computed color values for HeroUI theme tokens.
 *
 * This is applied to recharts as it does not support TailwindCSS classes.
 */
export function useThemeColorValues(): { primary: string, background: string } {
    const [primary, setPrimary] = useState("#ffffff");
    const [background, setBackground] = useState("#333");

    useEffect(() => {
        const style = getComputedStyle(document.documentElement);

        setPrimary(
            hslToHex(style.getPropertyValue("--heroui-primary"))
        );

        setBackground(
            hslToHex(style.getPropertyValue("--heroui-foreground-400"))
        );
    }, []);

    return { primary, background };
}
