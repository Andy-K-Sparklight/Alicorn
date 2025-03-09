import type { VersionEntry } from "@/main/install/vanilla";
import { useVersionManifest } from "@/renderer/services/sources";
import { useNav } from "@/renderer/util/nav";
import { CardRadio } from "@components/CardRadio";
import { GameTypeImage } from "@components/GameTypeImage";
import { WizardCard } from "@components/WizardCard";
import { RadioGroup } from "@heroui/radio";
import { Button, Input, Link, Spinner, Switch } from "@heroui/react";
import { useCreateGameWizardContext } from "@pages/create-game-wizard/CreateGameWizardView";
import { CheckIcon, SearchIcon } from "lucide-react";
import React, { useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import throttle from "throttleit";
import { VList, type VListHandle } from "virtua";

export function PickVersionView() {
    const { t } = useTranslation("pages", { keyPrefix: "create-game-wizard.pick-version" });
    const ctx = useCreateGameWizardContext();
    const [version, setVersion] = useState<string | null>(null);
    const nav = useNav();
    const [includeSnapshot, setIncludeSnapshot] = useState(false);

    const vlistRef = useRef<VListHandle | null>(null);
    const manifest = useVersionManifest();
    const versions = manifest && manifest?.versions?.filter(v => includeSnapshot || v.type !== "snapshot");


    function selectLatest() {
        if (versions) {
            setVersion(manifest.latest.release);
            vlistRef.current?.scrollToIndex(
                versions.findIndex(v => v.id === manifest.latest.release)
            );
        }
    }

    const onSearch = throttle((s: string) => {
        if (versions) {
            const id = versions.findIndex(v => v.id.includes(s));
            if (id >= 0) {
                vlistRef.current?.scrollToIndex(id);
            }
        }
    }, 1000);

    function confirmSelect() {
        ctx.setValue({ ...ctx.value, gameVersion: version ?? undefined });
        nav("/games/new-wizard/pick-mod-loader");
    }

    const snapshotSwitch =
        <Switch isSelected={includeSnapshot} onValueChange={setIncludeSnapshot}>
            {t("include-snapshot")}
        </Switch>;

    return <WizardCard
        title={t("title")}
        sub={t("sub")}
        content={
            <div className="flex flex-col h-full gap-4">
                {snapshotSwitch}
                <div className="text-sm text-foreground-500">
                    <Trans
                        t={t}
                        i18nKey="hint"
                        components={[
                            <Link className="text-sm" onPress={selectLatest}/>
                        ]}
                    />
                </div>
                <div className="mt-auto">
                    <Button
                        fullWidth
                        startContent={<CheckIcon/>}
                        color="primary"
                        isDisabled={!version}
                        onPress={confirmSelect}
                    >
                        {t("btn")}
                    </Button>
                </div>
            </div>
        }
    >
        <div className="w-full h-full overflow-y-scroll">
            {
                versions ?
                    <div className="w-full h-full flex flex-col gap-4">
                        <Input onValueChange={onSearch} startContent={<SearchIcon/>}/>
                        <RadioGroup
                            value={version}
                            onValueChange={setVersion}
                            className="h-full"
                            classNames={{ wrapper: "h-full" }}
                        >
                            <VList ref={vlistRef} className="h-full pr-2">
                                {
                                    versions
                                        .map(v =>
                                            <CardRadio value={v.id} key={v.id} className="w-full">
                                                <VersionContent version={v}/>
                                            </CardRadio>
                                        )
                                }
                            </VList>
                        </RadioGroup>
                    </div>
                    :
                    <div className="flex w-full h-full items-center justify-center">
                        <Spinner variant="wave"/>
                    </div>
            }
        </div>
    </WizardCard>;
}

function VersionContent({ version: { id, type, sha1, releaseTime } }: { version: VersionEntry }) {
    const gameType = ({
        "release": "vanilla-release",
        "snapshot": "vanilla-snapshot",
        "old_alpha": "vanilla-old-alpha",
        "old_beta": "vanilla-old-beta"
    } as const)[type] ?? "unknown";

    return <div className="flex h-[48px] items-center gap-4 py-1">
        <div className="h-full aspect-square rounded-full bg-content2 p-1.5">
            <GameTypeImage type={gameType}/>
        </div>

        <div className="flex flex-col">
            <div className="font-bold text-lg">{id}</div>
            <div className="flex items-center text-foreground-400 text-sm">
                {new Date(releaseTime).toLocaleString()}
            </div>
        </div>
    </div>;
}
