import { Button, Tabs } from "@heroui/react";
import { type PageInfo, pages } from "@pages/pages";
import { MinusIcon, SparklesIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

/**
 * Application navigator on the top.
 */
export function Navigator() {
    return (
        <div className="flex gap-2 justify-center items-center py-4">
            <div className="drag w-11/12 h-full flex items-center justify-between bg-default rounded-full py-1 px-1">
                <PageTabs />

                <div className="flex items-center gap-1 no-drag">
                    <MinimizeButton />
                    <CloseButton />
                </div>
            </div>
        </div>
    );
}

function PageTabs() {
    const [pathname, nav] = useLocation();

    const isSetup = pathname.startsWith("/setup");

    const activeTab = isSetup
        ? "setup"
        : (pages.find(p => pathname.startsWith(`/${p.id}`))?.id ?? pages[0].id);

    return (
        <Tabs
            className="no-drag"
            onSelectionChange={k => !isSetup && nav(`/${k}`)}
            selectedKey={activeTab}
        >
            <Tabs.ListContainer>
                {isSetup ? (
                    // Tabs will have incorrect indicator when the title is altered
                    // This div forces a structural change and re-render.
                    <div>
                        <Tabs.List>
                            <Tabs.Tab id="setup">
                                <PageTitle page={{ id: "setup", icon: SparklesIcon }} />
                                <Tabs.Indicator className="bg-accent" />
                            </Tabs.Tab>
                        </Tabs.List>
                    </div>
                ) : (
                    <Tabs.List>
                        {pages.map(p => (
                            <Tabs.Tab id={p.id} key={p.id}>
                                <PageTitle page={p} />
                                <Tabs.Indicator className="bg-accent" />
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                )}
            </Tabs.ListContainer>
        </Tabs>
    );
}

function PageTitle({ page }: { page: PageInfo }) {
    const { t } = useTranslation("pages");
    const { id, icon: Icon } = page;

    return (
        <div className="flex items-center gap-2 py-1">
            <Icon />
            <span className="break-keep">{t(`${id}.title`)}</span>
        </div>
    );
}

/**
 * The close button. Shows on the right corner when the cursor is moved near it, otherwise hidden for a cleaner LAF.
 */
function CloseButton() {
    return (
        <Button
            onPress={() => native.bwctl.close()}
            className="rounded-full bg-transparent text-foreground hover:bg-danger"
            isIconOnly
            variant="danger"
        >
            <XIcon />
        </Button>
    );
}

function MinimizeButton() {
    return (
        <Button
            onPress={() => native.bwctl.minimize()}
            className="rounded-full bg-transparent text-foreground hover:bg-default-hover"
            isIconOnly
        >
            <MinusIcon />
        </Button>
    );
}
