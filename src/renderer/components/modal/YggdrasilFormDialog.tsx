import { Alert } from "@components/display/Alert";
import {
    Button,
    cn,
    Description,
    FieldError,
    InputGroup,
    Label,
    Modal,
    Separator,
    TextField,
} from "@heroui/react";
import { GlobeIcon, KeyRoundIcon, UserIcon } from "lucide-react";
import { type DragEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DetailedAccountProps } from "@/main/auth/types";

interface YggdrasilFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAccountAdded?: (a: DetailedAccountProps) => void;
    trusted?: boolean;
    host?: string;
    email?: string;
}

export function YggdrasilFormDialog({
    isOpen,
    onClose,
    trusted,
    onAccountAdded,
    host,
    email,
}: YggdrasilFormDialogProps) {
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
        if (d.startsWith("authlib-injector:yggdrasil-server:")) {
            const url = decodeURIComponent(
                d.slice("authlib-injector:yggdrasil-server:".length).trim(),
            );
            if (URL.parse(url) && !host) {
                setUserHost(url);
            }
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "link";
    }

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={open => !open && onClose()}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <div onDrop={handleDrop} onDragOver={handleDragOver} className="contents">
                            <Modal.CloseTrigger />
                            <Modal.Header>
                                <Modal.Heading>{t("title")}</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body className="flex flex-col gap-4">
                                <TextField
                                    variant="secondary"
                                    type="url"
                                    isDisabled={!!host}
                                    isInvalid={hostInvalid}
                                >
                                    <Label>{t("host")}</Label>
                                    <InputGroup>
                                        <InputGroup.Prefix>
                                            <GlobeIcon />
                                        </InputGroup.Prefix>
                                        <InputGroup.Input
                                            value={userHost}
                                            onChange={e => handleHostChange(e.target.value)}
                                        />
                                    </InputGroup>
                                    <FieldError>{t("invalid-url")}</FieldError>
                                </TextField>

                                {(!userHost || hostInvalid) && (
                                    <Alert
                                        className="bg-default-soft"
                                        status="accent"
                                        title={t("dnd-hint")}
                                    />
                                )}

                                {userHost && !hostInvalid && !trusted && (
                                    <Alert
                                        className="bg-default-soft"
                                        status="warning"
                                        title={
                                            <span className="whitespace-pre-line">
                                                {t("untrusted", { host: userHost })}
                                            </span>
                                        }
                                    />
                                )}

                                <Separator />

                                <TextField variant="secondary" isDisabled={!!email}>
                                    <Label>{t("username")}</Label>
                                    <InputGroup>
                                        <InputGroup.Prefix>
                                            <UserIcon />
                                        </InputGroup.Prefix>
                                        <InputGroup.Input
                                            value={userEmail}
                                            onChange={e => setUserEmail(e.target.value)}
                                        />
                                    </InputGroup>
                                </TextField>

                                <TextField variant="secondary" type="password">
                                    <Label>{t("password")}</Label>
                                    <InputGroup>
                                        <InputGroup.Prefix>
                                            <KeyRoundIcon />
                                        </InputGroup.Prefix>
                                        <InputGroup.Input
                                            value={pwd}
                                            onChange={e => setPwd(e.target.value)}
                                        />
                                    </InputGroup>
                                    <Description>{t("pwd-no-store")}</Description>
                                </TextField>
                                {loginError && <Alert status="danger" title={t("failed")} />}
                            </Modal.Body>
                            <Modal.Footer>
                                {canSubmit && (
                                    <Button
                                        isPending={loggingIn}
                                        className={cn(!btnConfirmed && "text-warning")}
                                        variant={btnConfirmed ? "primary" : "secondary"}
                                        onPress={handleButtonPress}
                                    >
                                        {t(btnConfirmed ? "btn.login" : "btn.confirm", {
                                            host: userHost,
                                        })}
                                    </Button>
                                )}
                            </Modal.Footer>
                        </div>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
