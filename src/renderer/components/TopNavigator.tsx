import { Tab, Tabs } from "@heroui/react";
import { type PageInfo, pages } from "@pages/pages";
import React, { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

/**
 * Sidebar for page selecting.
 */
export const TopNavigator: FC = () => {
    const [selected, setSelected] = useState(pages[0].id || "");
    const [pathname, navigate] = useLocation();
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
        const { icon, title, id } = info;
        return <Tab
            title={
                <div className="flex items-center gap-2">
                    {React.createElement(icon)}
                    {t(title)}
                </div>
            }

            key={id}
        />;
    }

    // A workaround for https://github.com/heroui-inc/heroui/issues/4598
    function changePage(id: string | number) {
        const href = pages.find(p => p.id === id)?.href;
        if (href) {
            navigate(href);
        }
    }

    return <div className="flex flex-col w-full h-full items-center justify-center">
        <Tabs
            color="primary"
            variant="bordered"
            selectedKey={selected}
            onSelectionChange={changePage}
        >
            {pages.map(page => createPageTab(page))}
        </Tabs>
    </div>;
};
