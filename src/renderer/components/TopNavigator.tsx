import { Tab, Tabs } from "@heroui/react";
import { pages } from "@pages/pages";
import React, { type FC } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

/**
 * Sidebar for page selecting.
 */
export const TopNavigator: FC = () => {
    const [pathname, navigate] = useLocation();
    const { t } = useTranslation("pages");

    const currentTabId = pages.find(p => pathname.startsWith(p.href))?.id ?? pages[0].id;

    // A workaround for https://github.com/heroui-inc/heroui/issues/4598
    function changePage(id: string | number) {
        const href = pages.find(p => p.id === id)?.href;
        if (href) {
            navigate(href);
        }
    }

    return <div className="flex flex-col w-full h-full items-center justify-center">
        <Tabs
            className="no-drag"
            color="primary"
            selectedKey={currentTabId}
            onSelectionChange={changePage}
        >
            {
                pages.map(({ icon, title, id }) =>
                    <Tab
                        title={
                            <div className="flex items-center gap-2">
                                {React.createElement(icon)}
                                {t(title)}
                            </div>
                        }

                        key={id}
                    />
                )
            }
        </Tabs>
    </div>;
};
