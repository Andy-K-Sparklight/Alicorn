import { CogIcon, InfoIcon, RocketIcon } from "lucide-react";
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
        icon: RocketIcon,
        id: "launch",
        title: "launch.title",
        href: "/Launch"
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
