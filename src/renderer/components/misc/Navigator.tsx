import { useGameProcList } from "@/renderer/services/proc";
import { Button, Tab, Tabs } from "@heroui/react";
import { type PageInfo, pages } from "@pages/pages";
import { MinusIcon, SparklesIcon, XIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

/**
 * Application navigator on the top.
 */
export function Navigator() {
    return <div className="flex gap-2 justify-center items-center py-4">
        <div className="drag w-11/12 h-full flex items-center justify-between bg-default-100 rounded-full py-1 px-1">
            <div className="no-drag">
                <PageTabs/>
            </div>

            <div className="flex items-center gap-1 no-drag">
                <MinimizeButton/>
                <CloseButton/>
            </div>
        </div>
    </div>;
}

function PageTabs() {
    const [pathname, nav] = useLocation();
    const procs = useGameProcList();

    const hideMonitor = procs.length === 0;

    const activePages = pages.filter(p => !(p.id === "monitor" && hideMonitor));

    const isSetup = pathname.startsWith("/setup");

    const activeTab = isSetup ? "setup" : pages.find(p => pathname.startsWith("/" + p.id))?.id ?? pages[0].id;

    return <Tabs
        color="primary"
        variant="light"
        radius="full"
        // A temporary workaround since routing seems not working
        onSelectionChange={(k) => nav("/" + k)}
        selectedKey={activeTab}
    >
        {
            isSetup ?
                <Tab
                    key="setup"
                    title={
                        <PageTitle page={{ id: "setup", icon: SparklesIcon }}/>
                    }
                >

                </Tab>
                :
                activePages.map(p =>
                    // Tabs cannot be extracted as separated components or HeroUI will complain
                    // Upstream issue: https://github.com/heroui-inc/heroui/issues/729
                    <Tab
                        title={
                            <PageTitle page={p}/>
                        }
                        key={p.id}
                    />
                )
        }
    </Tabs>;
}

function PageTitle({ page }: { page: PageInfo }) {
    const { t } = useTranslation("pages");
    const { id, icon: Icon } = page;

    return <div className="flex items-center gap-2">
        <Icon/>
        {t(id + ".title")}
    </div>;
}


/**
 * The close button. Shows on the right corner when the cursor is moved near it, otherwise hidden for a cleaner LAF.
 */
function CloseButton() {
    return <Button
        onPress={() => native.bwctl.close()}
        className="rounded-full bg-transparent text-foreground hover:bg-danger"
        color="danger"
        isIconOnly
        variant="solid"
    >
        <XIcon/>
    </Button>;
}

function MinimizeButton() {
    return <Button
        onPress={() => native.bwctl.minimize()}
        className="rounded-full bg-transparent text-foreground hover:bg-default"
        isIconOnly
    >
        <MinusIcon/>
    </Button>;
}
