import type { InstallerProps } from "@/main/install/installers";

import { useAccounts } from "@/renderer/store/accounts";

import { useGameProfile } from "@/renderer/store/games";
import { useNav } from "@/renderer/util/nav";
import { Alert } from "@components/Alert";
import type { PropsWithParams } from "@components/AnimatedRoute";
import { PlayerNameInput } from "@components/PlayerNameInput";
import { Radio, RadioGroup } from "@heroui/radio";
import { addToast, Button, Input, Switch } from "@heroui/react";
import { AccountSelector } from "@pages/create-game/AccountSelector";
import { AssetLevelSelector } from "@pages/create-game/AssetsLevelSelector";
import { ContainerSelector } from "@pages/create-game/ContainerSelector";
import { ModLoaderSelector } from "@pages/create-game/ModLoaderSelector";
import { ModLoaderVersionSelector } from "@pages/create-game/ModLoaderVersionSelector";
import { VersionSelector } from "@pages/create-game/VersionSelector";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "react-use";

/**
 * Create new game without the help of the wizard.
 */
export function CreateGameView({ params: { gameId } }: PropsWithParams<{ gameId?: string }>) {
    const { t } = useTranslation("pages", { keyPrefix: "create-game" });
    const accounts = useAccounts();
    const profile = useGameProfile(gameId ?? "");

    const [gameName, setGameName] = useState(profile?.name || t("default-name"));
    const [gameVersion, setGameVersion] = useState<string | undefined>(profile?.installProps.gameVersion);
    const [containerId, setContainerId] = useState<string | undefined>(profile?.launchHint.containerId);
    const [containerShouldLink, setContainerShouldLink] = useState(true);
    const [shareContainer, setShareContainer] = useState(!!profile?.launchHint.containerId);


    const [lastSelectedAccountId, setLastSelectedAccountId] = useLocalStorage<string>("create-game.account.last-selected");
    const initialAccountId =
        profile?.launchHint.accountId ||
        accounts.some(a => a.uuid === lastSelectedAccountId) ? lastSelectedAccountId : null;

    const [authType, setAuthType] = useState<"new-vanilla" | "manual" | "reuse">(initialAccountId ? "reuse" : "new-vanilla");

    const [accountId, setAccountId] = useState<string | null>(initialAccountId ?? null);

    const [playerName, setPlayerName] = useState<string>("Player");

    const [assetsLevel, setAssetsLevel] = useState<"full" | "video-only">(profile?.assetsLevel || "full");

    const [installType, setInstallType] = useState<string>(profile?.installProps.type || "vanilla");
    const [loaderVersion, setLoaderVersion] = useState<string>("");

    const [creating, setCreating] = useState(false);
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

    function handleAccountChange(id: string | null) {
        setAccountId(id);
        if (id) {
            setLastSelectedAccountId(id);
        }
    }

    const valid = gameVersion &&
        !(shareContainer && !containerId) &&
        !(authType === "manual" && !playerName) &&
        !(authType === "reuse" && !accountId);

    function buildInstallProps(): InstallerProps {
        if (!valid) throw "Cannot create game with incomplete install props";

        switch (installType) {
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
                    type: installType,
                    gameVersion,
                    loaderVersion
                };
        }

        throw `Unsupported mod loader: ${installType}`;
    }

    async function handleCreate() {
        if (valid) {
            setCreating(true);
            await native.game.add({
                id: gameId,
                name: gameName,
                containerId,
                accountId,
                authType,
                playerName,
                installProps: buildInstallProps(),
                gameVersion,
                assetsLevel,
                containerShouldLink
            });
            setCreating(false);
            addToast({
                color: "success",
                title: t("toast-created")
            });
            nav("/games");
        }
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
                            <Alert color="warning" classNames={{ title: "font-bold" }} title={t("share-alert")}/>
                            <ContainerSelector containerId={containerId} onChange={setContainerId}/>
                        </>
                    }
                </div>


                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("account-title")}</div>

                    <RadioGroup
                        value={authType}
                        onValueChange={(s) => setAuthType(s as any)}
                    >
                        <Radio value="new-vanilla" description={t("account.new-vanilla.sub")}>
                            {t("account.new-vanilla.label")}
                        </Radio>

                        <Radio value="manual" description={t("account.manual.sub")}>
                            {t("account.manual.label")}
                        </Radio>

                        <Radio value="reuse" description={t("account.reuse.sub")}>
                            {t("account.reuse.label")}
                        </Radio>

                    </RadioGroup>

                    {
                        authType === "reuse" && <AccountSelector accountId={accountId} onChange={handleAccountChange}/>
                    }

                    {
                        authType === "manual" && <PlayerNameInput onChange={setPlayerName}/>
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
                    isLoading={creating}
                    isDisabled={!valid}
                    onPress={handleCreate}
                >
                    {t("create-btn")}
                </Button>
            </div>
        </div>
    </div>;
}
