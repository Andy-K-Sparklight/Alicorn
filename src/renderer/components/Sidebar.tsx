import React, { type FC, useEffect, useState } from "react";
import { Tab, Tabs } from "@nextui-org/react";
import { type PageInfo, pages } from "@pages/pages";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

/**
 * Sidebar for page selecting.
 */
export const Sidebar: FC = () => {
    const [selected, setSelected] = useState(pages[0].id || "");
    const [pathname] = useLocation();
    const { t } = useTranslation("pages");

    useEffect(() => {
        const sel = pages.find(p => pathname.startsWith(p.href))?.id;
        if (sel) setSelected(sel);
    }, [pathname]);

    /**
     * Creates page tab button based on page info.
     * This cannot be extracted as a separated component or NextUI will complain.
     */
    function createPageTab(info: PageInfo) {
        const { icon, title, id, href } = info;
        return <Tab
            title={
                <div className="flex items-center gap-2 mx-6">
                    {React.createElement(icon)}
                    {t(title)}
                </div>
            }

            key={id}
            href={href}
        />;
    }

    return <div className="flex flex-col w-full h-full items-center justify-center">
        <Tabs color="primary" size="lg" isVertical selectedKey={selected}>
            {pages.map(page => createPageTab(page))}
        </Tabs>
    </div>;
};