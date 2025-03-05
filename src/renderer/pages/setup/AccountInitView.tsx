import type { DetailedAccountProps } from "@/main/auth/types";
import { DialogProvider, type PropsWithDialog, useOpenDialog } from "@components/DialogProvider";
import { Radio, RadioGroup } from "@heroui/radio";
import { Button, Link, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useSetupNextPage } from "@pages/setup/SetupView";
import { ArrowRightIcon, UserRoundPlusIcon, UserSquareIcon } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

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

    return <div className="flex flex-col w-5/6 h-full mx-auto items-center">
        <div className="grow flex flex-col w-full items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-4">
                <div>
                    <UserSquareIcon size={64}/>
                </div>

                <h1 className="font-bold text-3xl text-center">
                    {t("title")}
                </h1>
                <p className="text-foreground-400 whitespace-pre-line text-center">
                    {
                        loggedIn ?
                            t("sub-ok", {
                                playerName: accountProps?.playerName,
                                uuid: accountProps?.uuid
                            })
                            : t("sub")
                    }
                </p>
            </div>

            <Button
                isLoading={loginActive}
                color="primary"
                startContent={!loginActive && (loggedIn ? <ArrowRightIcon/> : <UserRoundPlusIcon/>)}
                onPress={loggedIn ? next : handleAuth}
            >
                {t(loggedIn ? "btn-next" : "btn-login")}
            </Button>

            <DialogProvider dialogProps={{}} component={SkipLoginDialog}>
                <SkipLoginLink onConfirm={next}/>
            </DialogProvider>
        </div>

        <div className="text-sm text-foreground-400 mt-auto">{t("warranty")}</div>
    </div>;
}

function SkipLoginLink({ onConfirm }: { onConfirm: () => void }) {
    const { t } = useTranslation("setup", { keyPrefix: "account-init" });
    const showDialog = useOpenDialog<boolean>();

    async function handlePress() {
        if (await showDialog()) {
            onConfirm();
        }
    }

    return <Link color="primary" className="justify-center" onPress={handlePress}>{t("btn-skip")}</Link>;
}

function SkipLoginDialog({ isOpen, onResult }: PropsWithDialog<boolean, {}>) {
    const { t } = useTranslation("setup", { keyPrefix: "account-init.skip-confirm" });
    const [selected, setSelected] = useState("");

    function handleSelectionChange(s: string) {
        setSelected(s);
    }

    function handleConfirm() {
        onResult(true);
    }

    const allowSkip = selected === "offline";

    return <Modal isOpen={isOpen} onClose={() => onResult(false)} size="xl">
        <ModalContent>
            <ModalHeader className="flex flex-col gap-1">{t("title")}</ModalHeader>
            <ModalBody>
                <RadioGroup value={selected} onValueChange={handleSelectionChange}>
                    {
                        ["alt-account", "no-account", "offline"].map(sel =>
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
                    allowSkip &&
                    <Button
                        fullWidth
                        color="primary"
                        onPress={handleConfirm}
                    >
                        {t("btn")}
                    </Button>
                }
            </ModalFooter>
        </ModalContent>
    </Modal>;
}
