import { remoteInstaller } from "@/renderer/services/install";
import { useNav } from "@/renderer/util/nav";
import { Alert } from "@components/Alert";
import { ConfirmPopup } from "@components/ConfirmPopup";
import { DialogProvider, type PropsWithDialog, useOpenDialog } from "@components/DialogProvider";
import { Radio, RadioGroup } from "@heroui/radio";
import { addToast, Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import { CloudDownloadIcon, PickaxeIcon, RefreshCwIcon, TrashIcon, UnlinkIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function AdvancedPanel() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.advanced" });
    const nav = useNav();
    const game = useCurrentGameProfile();
    const { id, name, assetsLevel } = game;

    async function handleUnlink() {
        await native.game.remove(id);
        nav("/games");
    }

    function handleReinstall() {
        nav("/games");
        void remoteInstaller.install(id);
    }

    function handleRecreate() {
        nav(`/create-game/${id}`);
    }

    function handleInstallFull() {
        const ng = structuredClone(game);
        ng.assetsLevel = "full";
        nav("/games");

        (async () => {
            await native.game.update(ng);
            await remoteInstaller.install(id);
        })();
    }

    return <div className="flex flex-col gap-6">
        {
            assetsLevel !== "full" &&
            <div className="flex items-center">
                <div className="grow flex flex-col gap-1">
                    <div className="font-bold text-lg">{t("install-full.label")}</div>
                    <div className="text-sm text-foreground-400">{t("install-full.sub")}</div>
                </div>

                <Button
                    startContent={<CloudDownloadIcon/>}
                    onPress={handleInstallFull}
                    color="primary"
                >
                    {t("install-full.btn")}
                </Button>
            </div>
        }


        <div className="flex items-center">
            <div className="grow flex flex-col gap-1">
                <div className="font-bold text-lg">{t("reinstall.label")}</div>
                <div className="text-sm text-foreground-400">{t("reinstall.sub")}</div>
            </div>

            <Button
                startContent={<RefreshCwIcon/>}
                onPress={handleReinstall}
            >
                {t("reinstall.btn", { name })}
            </Button>
        </div>

        <div className="flex items-center">
            <div className="grow flex flex-col gap-1">
                <div className="font-bold text-lg">{t("recreate.label")}</div>
                <div className="text-sm text-foreground-400">{t("recreate.sub")}</div>
            </div>

            <Button
                startContent={<PickaxeIcon/>}
                onPress={handleRecreate}
            >
                {t("recreate.btn", { name })}
            </Button>
        </div>

        <div className="mt-6 w-full flex flex-col gap-6 rounded-xl border-2 border-danger border-solid p-4">
            <Alert classNames={{ title: "font-bold" }} color="danger" title={t("danger-warn")}/>

            <div className="flex items-center">
                <div className="grow flex flex-col gap-1">
                    <div className="font-bold text-lg">{t("unlink.label")}</div>
                    <div className="text-sm text-foreground-400">{t("unlink.sub")}</div>
                </div>

                <ConfirmPopup
                    placement="right"
                    title={t("unlink.confirm.title")}
                    sub={t("unlink.confirm.sub")}
                    btnText={t("unlink.confirm.btn")}
                    onConfirm={handleUnlink}
                    color="danger"
                >
                    <Button startContent={<UnlinkIcon/>} color="danger">
                        {t("unlink.btn", { name })}
                    </Button>
                </ConfirmPopup>
            </div>

            <DialogProvider dialogProps={{ name, id }} component={DestroyCompoundDialog}>
                <DestroyEntry/>
            </DialogProvider>
        </div>
    </div>;
}

function DestroyEntry() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.advanced" });
    const { t: tc } = useTranslation("common");
    const game = useCurrentGameProfile();
    const { id, name } = game;
    const nav = useNav();

    const [sharedGames, setSharedGames] = useState<string[]>([]);

    useEffect(() => {
        native.game.queryShared(id).then(setSharedGames);
    }, [id]);

    const openDialog = useOpenDialog<boolean>();

    const canDestroy = sharedGames.length === 0;

    async function handleBtnClick() {
        const res = await openDialog();
        if (res) {
            native.game.destroy(id);
            addToast({
                color: "success",
                title: tc("toast.game-destroyed", { name })
            });
            nav("/games");
        }
    }

    return <div className="flex items-center">

        <div className="grow flex flex-col gap-1">
            <div className="font-bold text-lg">{t("destroy.label")}</div>
            <div className="text-sm text-foreground-400 whitespace-pre-line">
                {
                    canDestroy ?
                        t("destroy.sub") :
                        t("destroy.sub-disabled", { sharedGames: sharedGames.join(" ") })
                }
            </div>
        </div>

        <Button startContent={<TrashIcon/>} color="danger" onPress={handleBtnClick} isDisabled={!canDestroy}>
            {t("destroy.btn", { name })}
        </Button>
    </div>;
}

function DestroyCompoundDialog({ isOpen, onResult, id, name }: PropsWithDialog<boolean, { id: string, name: string }>) {
    const [stage, setStage] = useState<"confirm" | "challenge">("confirm");

    function handleConfirmResult(v: boolean) {
        if (!v) {
            onResult(false);
        } else {
            setStage("challenge");
        }
    }

    return <>
        <DestroyConfirmDialog
            isOpen={isOpen && stage === "confirm"}
            onResult={handleConfirmResult}
            id={id}
            name={name}
        />

        <DestroyChallengeDialog
            isOpen={isOpen && stage === "challenge"}
            onResult={onResult}
            name={name}
        />
    </>;
}


function DestroyConfirmDialog({ isOpen, onResult, id, name }: PropsWithDialog<boolean, { id: string, name: string }>) {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.advanced.destroy.confirm" });
    const [input, setInput] = useState("");

    return <Modal isOpen={isOpen} onClose={() => onResult(false)} size="2xl">
        <ModalContent>
            <ModalHeader>{t("title")}</ModalHeader>
            <ModalBody>
                <p className="whitespace-pre-line">
                    {t("sub", { name })}
                </p>

                <Input className="mt-2" description={t("input-hint")} value={input} onValueChange={setInput} size="sm"/>
            </ModalBody>
            <ModalFooter>
                {

                    <Button
                        fullWidth
                        color="danger"
                        isDisabled={input !== id}
                        onPress={() => onResult(true)}
                    >
                        {t("btn", { name })}
                    </Button>
                }
            </ModalFooter>
        </ModalContent>
    </Modal>;
}

function DestroyChallengeDialog({ isOpen, onResult, name }: PropsWithDialog<boolean, { name: string }>) {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.advanced.destroy.challenge" });
    const [selected, setSelected] = useState("");
    const [btnClicked, setBtnClicked] = useState(0);

    function handleSelectionChange(s: string) {
        setSelected(s);
        if (s !== "correct") {
            setBtnClicked(0);
        }
    }

    function handleConfirm() {
        if (btnClicked < 2) {
            setBtnClicked(n => n + 1);
        } else {
            onResult(true);
        }
    }

    return <Modal isOpen={isOpen} onClose={() => onResult(false)} size="2xl">
        <ModalContent>
            <ModalHeader className="flex flex-col gap-1">{t("title", { name })}</ModalHeader>
            <ModalBody>
                <RadioGroup color="danger" value={selected} onValueChange={handleSelectionChange}>
                    {
                        ["wrong-1", "wrong-2", "wrong-3", "correct"].map(sel =>
                            <Radio
                                description={selected === sel && t(`${sel}.sub`)}
                                key={sel}
                                value={sel}
                            >
                                {t(`${sel}.label`)}
                            </Radio>
                        )
                    }
                </RadioGroup>
            </ModalBody>
            <ModalFooter>
                {
                    selected === "correct" &&
                    <Button
                        fullWidth
                        color="danger"
                        onPress={handleConfirm}
                    >
                        {t(`btn.${btnClicked}`, { name })}
                    </Button>
                }
            </ModalFooter>
        </ModalContent>
    </Modal>;
}
