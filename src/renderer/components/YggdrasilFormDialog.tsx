import type { DetailedAccountProps } from "@/main/auth/types";
import { Alert } from "@heroui/alert";
import { Button, Divider, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { GlobeIcon, KeyRoundIcon, UserIcon } from "lucide-react";
import { type DragEvent, useState } from "react";
import { useTranslation } from "react-i18next";

interface YggdrasilFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAccountAdded?: (a: DetailedAccountProps) => void;
    trusted?: boolean;
    host?: string;
    email?: string;
}

export function YggdrasilFormDialog(
    { isOpen, onClose, trusted, onAccountAdded, host, email }
    : YggdrasilFormDialogProps
) {
    const { t } = useTranslation("common", { keyPrefix: "yggdrasil-form" });
    const [userHost, setUserHost] = useState(host || "");
    const [userEmail, setUserEmail] = useState(email || "");
    const [pwd, setPwd] = useState("");
    const hostInvalid = !!userHost && !URL.parse(userHost);
    const [btnConfirmed, setBtnConfirmed] = useState(trusted);
    const [loginError, setLoginError] = useState(false);
    const [loggingIn, setLoggingIn] = useState(false);

    const canSubmit = userHost && !hostInvalid && userEmail && pwd;

    function handleHostChange(s: string) {
        setBtnConfirmed(trusted);
        setUserHost(s);
    }

    async function handleButtonPress() {
        if (btnConfirmed) {
            setLoginError(false);
            setLoggingIn(true);

            try {
                const a = await native.auth.createYggdrasil(userHost, userEmail, pwd);
                onClose();
                onAccountAdded?.(a);
            } catch {
                setLoginError(true);
            }
            setLoggingIn(false);
        } else {
            setBtnConfirmed(true);
        }
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        const d = e.dataTransfer.getData("text/plain");
        console.log(d);
        if (d.startsWith("authlib-injector:yggdrasil-server:")) {
            const url = decodeURIComponent(d.slice("authlib-injector:yggdrasil-server:".length).trim());
            if (URL.parse(url) && !host) {
                setUserHost(url);
            }
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "link";
    }

    return <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent onDrop={handleDrop} onDragOver={handleDragOver}>
            <ModalHeader>{t("title")}</ModalHeader>
            <ModalBody>
                <Input
                    startContent={<GlobeIcon/>}
                    label={t("host")}
                    value={userHost}
                    isDisabled={!!host}
                    onValueChange={handleHostChange}
                    labelPlacement="outside"
                    type="url"
                    isInvalid={hostInvalid}
                    errorMessage={t("invalid-url")}
                />
                {
                    (!userHost || hostInvalid) &&
                    <Alert
                        color="primary"
                        classNames={{ title: "font-bold" }}
                        title={t("dnd-hint")}
                    />
                }
                {
                    userHost && !hostInvalid && !trusted &&
                    <Alert
                        color="warning"
                        classNames={{ title: "font-bold" }}
                        title={
                            <span className="whitespace-pre-line">
                                {t("untrusted", { host: userHost })}
                            </span>
                        }
                    />
                }
                <Divider/>
                <Input
                    isDisabled={!!email}
                    startContent={<UserIcon/>}
                    value={userEmail}
                    onValueChange={setUserEmail}
                    label={t("username")}
                    labelPlacement="outside"
                />
                <Input
                    startContent={<KeyRoundIcon/>}
                    value={pwd}
                    onValueChange={setPwd}
                    label={t("password")}
                    type="password"
                    description={t("pwd-no-store")}
                    labelPlacement="outside"
                />
                {
                    loginError &&
                    <Alert color="danger" classNames={{ title: "font-bold" }} title={t("failed")}/>
                }
            </ModalBody>
            <ModalFooter>
                {
                    canSubmit &&
                    <Button
                        isLoading={loggingIn}
                        color={btnConfirmed ? "primary" : "warning"}
                        onPress={handleButtonPress}
                    >
                        {
                            t(btnConfirmed ? "btn.login" : "btn.confirm", { host: userHost })
                        }
                    </Button>
                }
            </ModalFooter>
        </ModalContent>
    </Modal>;
}
