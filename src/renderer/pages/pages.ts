import { BoxIcon, CogIcon, InfoIcon, SquareActivityIcon } from "lucide-react";
import React from "react";

/**
 * Describes a page in the app.
 */
export interface PageInfo {
    /**
     * Page ID used when rendering.
     */
    id: string;

    /**
     * Page icon class.
     */
    icon: React.ComponentType;
}

export const pages: PageInfo[] = [
    {
        id: "games",
        icon: BoxIcon
    },
    {
        id: "monitor",
        icon: SquareActivityIcon
    },
    {
        id: "settings",
        icon: CogIcon
    },
    {
        id: "about",
        icon: InfoIcon
    }
];
