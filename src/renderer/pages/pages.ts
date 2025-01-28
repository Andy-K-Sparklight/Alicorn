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

    /**
     * Page title (translation key).
     */
    title: string;

    /**
     * Route to navigate to when the icon is clicked.
     */
    href: string;
}

export const pages: PageInfo[] = [
    {
        icon: BoxIcon,
        id: "games",
        title: "games.title",
        href: "/Games"
    },
    {
        icon: SquareActivityIcon,
        id: "monitor",
        title: "monitor.title",
        href: "/Monitor"
    },
    {
        icon: CogIcon,
        id: "settings",
        title: "settings.title",
        href: "/Settings"
    },
    {
        icon: InfoIcon,
        id: "about",
        title: "about.title",
        href: "/About"
    }
];
