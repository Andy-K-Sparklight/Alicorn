import type { GameAssetsLevel } from "@/main/game/spec";
import type { InstallerProps } from "@/main/install/installers";
import { useGameProfile } from "@/renderer/services/games";
import { useNav } from "@/renderer/util/nav";
import { Alert } from "@components/display/Alert";
import type { PropsWithParams } from "@components/misc/AnimatedRoute";
import { Radio, RadioGroup } from "@heroui/radio";
import { addToast, Button, Input, Switch } from "@heroui/react";
import { AssetLevelSelector } from "@pages/create-game/AssetsLevelSelector";
import { ContainerSelector } from "@pages/create-game/ContainerSelector";
import { ModLoaderSelector } from "@pages/create-game/ModLoaderSelector";
import { ModLoaderVersionSelector } from "@pages/create-game/ModLoaderVersionSelector";
import { VersionSelector } from "@pages/create-game/VersionSelector";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Create new game without the help of the wizard.
 */
export function CreateGameView({ params: { gameId } }: PropsWithParams<{ gameId?: string }>) {
    const { t } = useTranslation("pages", { keyPrefix: "create-game" });
    const profile = useGameProfile(gameId ?? "");

    const [gameName, setGameName] = useState(profile?.name || t("default-name"));
    const [gameVersion, setGameVersion] = useState<string | undefined>((profile?.installProps as any)?.gameVersion || "");
    const [containerId, setContainerId] = useState<string | undefined>(profile?.launchHint.containerId);
    const [containerShouldLink, setContainerShouldLink] = useState(true);
    const [shareContainer, setShareContainer] = useState(!!profile?.launchHint.containerId);

    const [assetsLevel, setAssetsLevel] = useState<GameAssetsLevel>(profile?.assetsLevel || "full");

    const [installType, setInstallType] = useState<string>(profile?.installProps.type || "vanilla");
    const [loaderVersion, setLoaderVersion] = useState<string>("");

    const nav = useNav();

    const [availableModLoaders, setAvailableModLoaders] = useState<string[] | null>(null);

    useEffect(() => {
        if (gameVersion) {
            setAvailableModLoaders(null);
            native.install.queryAvailableModLoaders(gameVersion).then(setAvailableModLoaders);
        } else {
            setAvailableModLoaders([]);
        }
    }, [gameVersion]);


    const valid = gameVersion && !(shareContainer && !containerId);

    async function handleCreate() {
        if (valid) {
            await native.game.add({
                id: gameId,
                name: gameName,
                containerId,
                accountId: "",
                installProps: buildInstallProps(installType, gameVersion, loaderVersion),
                gameVersion,
                assetsLevel,
                containerShouldLink
            });
            addToast({
                color: "success",
                title: t("toast-created")
            });
            nav("/games");
        }
    }

    if (profile?.installProps.type === "imported") {
        return <Alert color="danger" title={t("no-import")}/>;
    }

    return <div className="w-11/12 h-full mx-auto overflow-y-auto overflow-x-hidden">
        <div className="mx-4">
            <div className="font-bold text-2xl">{t(gameId ? "title-re" : "title")}</div>
            <div className="w-full grow flex flex-col gap-6 mt-4">
                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("name-input-title")}</div>
                    <Input aria-label="Game Name" value={gameName} onValueChange={setGameName}/>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("version-select-title")}</div>
                    <VersionSelector version={gameVersion} onChange={setGameVersion}/>
                </div>


                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("storage-title")}</div>

                    <RadioGroup
                        value={shareContainer ? "share" : "new"}
                        onValueChange={v => setShareContainer(v === "share")}
                    >
                        {
                            ["new", "share"].map(lv =>
                                <div key={lv} className="flex flex-col gap-2">
                                    <Radio
                                        value={lv}
                                        color={lv === "share" ? "warning" : "primary"}
                                        description={t(`storage-policy.${lv}.sub`)}
                                    >
                                        {t(`storage-policy.${lv}.label`)}
                                    </Radio>
                                </div>
                            )
                        }
                    </RadioGroup>

                    {
                        !shareContainer &&
                        <Switch
                            size="sm"
                            isSelected={containerShouldLink}
                            onValueChange={setContainerShouldLink}
                            isDisabled={shareContainer}
                        >
                            <div className="flex flex-col">
                                <div className="text-medium">{t("container-link.label")}</div>
                                <div className="text-foreground-400 text-sm">{t("container-link.sub")}</div>
                            </div>
                        </Switch>
                    }

                    {
                        shareContainer &&
                        <>
                            <Alert color="warning" title={t("share-alert")}/>
                            <ContainerSelector containerId={containerId} onChange={setContainerId}/>
                        </>
                    }
                </div>

                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("assets-title")}</div>

                    <AssetLevelSelector assetsLevel={assetsLevel} onChange={setAssetsLevel}/>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("mod-loader-title")}</div>

                    <ModLoaderSelector
                        availableModLoaders={availableModLoaders}
                        value={installType}
                        onChange={setInstallType}
                    />

                    {
                        (["fabric", "quilt", "neoforged", "forge", "rift", "optifine"].includes(installType)) &&
                        <ModLoaderVersionSelector value={loaderVersion} onChange={setLoaderVersion}/>
                    }
                </div>

                <Button
                    fullWidth
                    color="primary"
                    size="lg"
                    isDisabled={!valid}
                    onPress={handleCreate}
                >
                    {t("create-btn")}
                </Button>
            </div>
        </div>
    </div>;
}

function buildInstallProps(type: string, gameVersion: string, loaderVersion: string): InstallerProps {
    switch (type) {
        case "vanilla":
            return {
                type: "vanilla",
                gameVersion
            };
        case "liteloader":
            return {
                type: "liteloader",
                gameVersion
            };
        case "fabric":
        case "quilt":
        case "neoforged":
        case "forge":
        case "rift":
        case "optifine":
            return {
                type,
                gameVersion,
                loaderVersion
            };
    }

    throw `Unsupported mod loader: ${type}`;
}
