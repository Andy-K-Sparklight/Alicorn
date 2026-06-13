import {
    DialogProvider,
    type PropsWithDialog,
    useOpenDialog,
} from "@components/modal/DialogProvider";
import { Button, Description, Label, Link, Modal, Radio, RadioGroup } from "@heroui/react";
import { useSetupNextPage } from "@pages/setup/SetupView";
import { ArrowRightIcon, UserRoundPlusIcon, UserSquareIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DetailedAccountProps } from "@/main/auth/types";

export function AccountInitView() {
    const { t } = useTranslation("setup", { keyPrefix: "account-init" });
    const [loginActive, setLoginActive] = useState(false);
    const [accountProps, setAccountProps] = useState<DetailedAccountProps | null>(null);
    const next = useSetupNextPage();

    const loggedIn = accountProps !== null;

    async function handleAuth() {
        try {
            setLoginActive(true);
            const props = await native.auth.createVanilla();
            setAccountProps(props);
        } finally {
            setLoginActive(false);
        }
    }

    return (
        <div className="flex flex-col w-5/6 h-full mx-auto items-center">
            <div className="grow flex flex-col w-full items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-4">
                    <div>
                        <UserSquareIcon size={64} />
                    </div>

                    <h1 className="font-bold text-3xl text-center">{t("title")}</h1>
                    <p className="text-muted whitespace-pre-line text-center">
                        {loggedIn
                            ? t("sub-ok", {
                                  playerName: accountProps?.playerName,
                                  uuid: accountProps?.uuid,
                              })
                            : t("sub")}
                    </p>
                </div>

                <Button
                    isPending={loginActive}
                    variant="primary"
                    onPress={loggedIn ? next : handleAuth}
                >
                    {!loginActive && (loggedIn ? <ArrowRightIcon /> : <UserRoundPlusIcon />)}
                    {t(loggedIn ? "btn-next" : "btn-login")}
                </Button>

                <DialogProvider dialogProps={{}} component={SkipLoginDialog}>
                    <SkipLoginLink onConfirm={next} />
                </DialogProvider>
            </div>

            <div className="text-sm text-muted mt-auto">{t("warranty")}</div>
        </div>
    );
}

function SkipLoginLink({ onConfirm }: { onConfirm: () => void }) {
    const { t } = useTranslation("setup", { keyPrefix: "account-init" });
    const showDialog = useOpenDialog<boolean>();

    async function handlePress() {
        if (await showDialog()) {
            onConfirm();
        }
    }

    return (
        <Link className="justify-center text-accent" onPress={handlePress}>
            {t("btn-skip")}
        </Link>
    );
}

function SkipLoginDialog({ isOpen, onResult }: PropsWithDialog<boolean, object>) {
    const { t } = useTranslation("setup", { keyPrefix: "account-init.skip-confirm" });
    const [selected, setSelected] = useState("");

    function handleSelectionChange(s: string) {
        setSelected(s);
    }

    function handleConfirm() {
        onResult(true);
    }

    const allowSkip = selected === "offline";

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={open => !open && onResult(false)}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>{t("title")}</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <RadioGroup value={selected} onChange={handleSelectionChange}>
                                {["alt-account", "no-account", "offline"].map(sel => (
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
                            {allowSkip && (
                                <Button fullWidth variant="primary" onPress={handleConfirm}>
                                    {t("btn")}
                                </Button>
                            )}
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
