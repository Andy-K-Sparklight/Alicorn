import { type Icon, InfoIcon, RocketIcon } from "@primer/octicons-react";

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
    icon: Icon;

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
        icon: InfoIcon,
        id: "about",
        title: "about.title",
        href: "/About"
    }
];
