import { Alert } from "@components/display/Alert";
import { ConfirmPopup } from "@components/modal/ConfirmPopup";
import {
    DialogProvider,
    type PropsWithDialog,
    useOpenDialog,
} from "@components/modal/DialogProvider";
import { Button, Description, Input, Label, Modal, Radio, RadioGroup, toast } from "@heroui/react";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import { CloudDownloadIcon, PickaxeIcon, RefreshCwIcon, TrashIcon, UnlinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { alter } from "@/main/util/misc";
import { remoteInstaller } from "@/renderer/services/install";
import { useNav } from "@/renderer/util/nav";

export function AdvancedPanel() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.advanced" });
    const nav = useNav();
    const game = useCurrentGameProfile();
    const { id, name, assetsLevel } = game;

    const isImported = game.installProps.type === "imported";

    async function handleUnlink() {
        await native.game.remove(id);
        nav("/games");
    }

    function handleReinstall() {
        nav("/games");
        void remoteInstaller.install(id);
    }

    function handleRecreate() {
        nav(`/games/new/${id}`);
    }

    function handleInstallFull() {
        nav("/games");

        (async () => {
            await native.game.update(alter(game, g => (g.assetsLevel = "full")));
            await remoteInstaller.install(id);
        })();
    }

    return (
        <div className="w-full h-full overflow-y-auto">
            <div className="px-4 py-2">
                <div className="flex flex-col gap-6">
                    {assetsLevel !== "full" && (
                        <div className="flex items-center">
                            <div className="grow flex flex-col gap-1">
                                <div className="font-bold text-lg">{t("install-full.label")}</div>
                                <div className="text-sm text-muted">{t("install-full.sub")}</div>
                            </div>

                            <Button onPress={handleInstallFull} variant="primary">
                                <CloudDownloadIcon />
                                {t("install-full.btn")}
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center">
                        <div className="grow flex flex-col gap-1">
                            <div className="font-bold text-lg">{t("reinstall.label")}</div>
                            <div className="text-sm text-muted">{t("reinstall.sub")}</div>
                        </div>

                        <Button onPress={handleReinstall}>
                            <RefreshCwIcon />
                            {t("reinstall.btn", { name })}
                        </Button>
                    </div>

                    {!isImported && (
                        <div className="flex items-center">
                            <div className="grow flex flex-col gap-1">
                                <div className="font-bold text-lg">{t("recreate.label")}</div>
                                <div className="text-sm text-muted">{t("recreate.sub")}</div>
                            </div>

                            <Button onPress={handleRecreate}>
                                <PickaxeIcon />
                                {t("recreate.btn", { name })}
                            </Button>
                        </div>
                    )}

                    <div className="mt-6 w-full flex flex-col gap-6 rounded-xl border-2 border-danger border-solid p-4">
                        <Alert status="danger" title={t("danger-warn")} />

                        <div className="flex items-center">
                            <div className="grow flex flex-col gap-1">
                                <div className="font-bold text-lg">{t("unlink.label")}</div>
                                <div className="text-sm text-muted">{t("unlink.sub")}</div>
                            </div>

                            <ConfirmPopup
                                placement="right"
                                title={t("unlink.confirm.title")}
                                sub={t("unlink.confirm.sub")}
                                btnText={t("unlink.confirm.btn")}
                                onConfirm={handleUnlink}
                                color="danger"
                            >
                                <Button variant="danger">
                                    <UnlinkIcon />
                                    {t("unlink.btn", { name })}
                                </Button>
                            </ConfirmPopup>
                        </div>

                        {!isImported && (
                            <DialogProvider
                                dialogProps={{ name, id }}
                                component={DestroyCompoundDialog}
                            >
                                <DestroyEntry />
                            </DialogProvider>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
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
            toast.success(tc("toast.game-destroyed", { name }));
            nav("/games");
        }
    }

    return (
        <div className="flex items-center">
            <div className="grow flex flex-col gap-1">
                <div className="font-bold text-lg">{t("destroy.label")}</div>
                <div className="text-sm text-muted whitespace-pre-line">
                    {canDestroy
                        ? t("destroy.sub")
                        : t("destroy.sub-disabled", { sharedGames: sharedGames.join(" ") })}
                </div>
            </div>

            <Button variant="danger" onPress={handleBtnClick} isDisabled={!canDestroy}>
                <TrashIcon />
                {t("destroy.btn", { name })}
            </Button>
        </div>
    );
}

function DestroyCompoundDialog({
    isOpen,
    onResult,
    id,
    name,
}: PropsWithDialog<
    boolean,
    {
        id: string;
        name: string;
    }
>) {
    const [stage, setStage] = useState<"confirm" | "challenge">("confirm");

    function handleConfirmResult(v: boolean) {
        if (!v) {
            onResult(false);
        } else {
            setStage("challenge");
        }
    }

    return (
        <>
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
        </>
    );
}

function DestroyConfirmDialog({
    isOpen,
    onResult,
    id,
    name,
}: PropsWithDialog<
    boolean,
    {
        id: string;
        name: string;
    }
>) {
    const { t } = useTranslation("pages", {
        keyPrefix: "game-detail.manage.advanced.destroy.confirm",
    });
    const [input, setInput] = useState("");

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={open => !open && onResult(false)}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>{t("title")}</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-2">
                            <p className="whitespace-pre-line">{t("sub", { name })}</p>

                            <Input
                                variant="secondary"
                                className="mt-2 text-sm"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                            />

                            <Description>{t("input-hint")}</Description>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                fullWidth
                                variant="danger"
                                isDisabled={input !== id}
                                onPress={() => onResult(true)}
                            >
                                {t("btn", { name })}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}

function DestroyChallengeDialog({
    isOpen,
    onResult,
    name,
}: PropsWithDialog<
    boolean,
    {
        name: string;
    }
>) {
    const { t } = useTranslation("pages", {
        keyPrefix: "game-detail.manage.advanced.destroy.challenge",
    });
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

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={open => !open && onResult(false)}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>{t("title", { name })}</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <RadioGroup
                                variant="secondary"
                                value={selected}
                                onChange={handleSelectionChange}
                            >
                                {["wrong-1", "wrong-2", "wrong-3", "correct"].map(sel => (
                                    <Radio key={sel} value={sel}>
                                        <Radio.Control>
                                            <Radio.Indicator />
                                        </Radio.Control>
                                        <Radio.Content>
                                            <Label>{t(`${sel}.label`)}</Label>
                                            {selected === sel && (
                                                <Description>{t(`${sel}.sub`)}</Description>
                                            )}
                                        </Radio.Content>
                                    </Radio>
                                ))}
                            </RadioGroup>
                        </Modal.Body>
                        <Modal.Footer>
                            {selected === "correct" && (
                                <Button fullWidth variant="danger" onPress={handleConfirm}>
                                    {t(`btn.${btnClicked}`, { name })}
                                </Button>
                            )}
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
