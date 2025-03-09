import { useConfig } from "@/renderer/store/conf";
import { Alert } from "@components/Alert";
import { GameTypeImage } from "@components/GameTypeImage";
import { Button, ButtonGroup, Card, CardBody, Input, Progress } from "@heroui/react";
import { useSetupNextPage } from "@pages/setup/SetupView";
import { BanIcon, CheckIcon, ChevronsRight, FlagIcon, MinusIcon, PlusIcon, ZoomInIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export function ZoomFactorView() {
    const { t } = useTranslation("setup", { keyPrefix: "zoom" });
    const next = useSetupNextPage();

    return <div className="flex flex-col w-5/6 h-full mx-auto items-center justify-center gap-4">
        <div className="w-full h-full flex items-center gap-16">
            <div className="flex flex-col gap-4 items-center">
                <div>
                    <ZoomInIcon size={64}/>
                </div>

                <h1 className="font-bold text-2xl text-center">{t("title")}</h1>
                <p className="text-foreground-400 whitespace-pre-line text-center">
                    {t("sub")}
                </p>

                <ZoomTuner/>

                <Button
                    color="primary"
                    className="mt-4"
                    startContent={<CheckIcon/>}
                    onPress={next}
                >
                    {t("btn")}
                </Button>
            </div>

            <ExampleContent/>
        </div>
    </div>;
}

function ZoomTuner() {
    const { config, alterConfig } = useConfig();
    if (!config) return null;

    const factor = config?.app.window.zoom;

    function updateZoom(v: number) {
        alterConfig(c => c.app.window.zoom = v);
        native.bwctl.setZoom(v);
    }

    function handleAdd() {
        updateZoom(factor + 10);
    }

    function handleSubtract() {
        updateZoom(factor - 10);
    }

    return <div className="flex gap-4 items-center">
        <Button isIconOnly size="sm" onPress={handleSubtract}>
            <MinusIcon/>
        </Button>
        {factor + "%"}
        <Button isIconOnly size="sm" onPress={handleAdd}>
            <PlusIcon/>
        </Button>
    </div>;
}

function ExampleContent() {
    const { t } = useTranslation("setup", { keyPrefix: "zoom.example" });

    return <div
        className="border-foreground-400 border-solid border-2 rounded-xl shrink-0 basis-1/2 flex flex-col gap-4 p-8"
    >
        <div className="font-bold text-2xl">{t("title")}</div>
        <div className="font-bold text-xl">{t("text-1")}</div>
        <div className="text-medium">{t("text-2")}</div>
        <Card>
            <CardBody>
                <div className="flex items-center gap-4">
                    <div className="rounded-full p-3 bg-content2 w-16 h-16">
                        <GameTypeImage type="fabric"/>
                    </div>

                    <div className="flex flex-col">
                        <div className="text-medium font-bold">{t("fabric.title")}</div>
                        <div className="text-sm text-foreground-400">{t("fabric.sub")}</div>
                    </div>
                </div>
            </CardBody>
        </Card>
        <Alert color="primary" classNames={{ title: "font-bold" }} title={t("alert")}/>
        <Input placeholder={t("input")}/>

        <Progress aria-label="Example Progress" isIndeterminate size="sm"/>

        <ButtonGroup fullWidth>
            <Button startContent={<FlagIcon/>}>{t("btn-1")}</Button>
            <Button startContent={<ChevronsRight/>}>{t("btn-2")}</Button>
            <Button startContent={<BanIcon/>}>{t("btn-3")}</Button>
        </ButtonGroup>
    </div>;
}
