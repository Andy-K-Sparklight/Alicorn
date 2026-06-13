import { ExtendedAccountPicker } from "@components/compound/ExtendedAccountPicker";
import type { PropsWithDialog } from "@components/modal/DialogProvider";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function AccountSelectorDialog(props: PropsWithDialog<string, object>) {
    const { t } = useTranslation("common", { keyPrefix: "account-selector-dialog" });
    const { onResult, isOpen } = props;
    const [accountId, setAccountId] = useState("new");
    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} isDismissable={false} isKeyboardDismissDisabled>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.Header>
                            <Modal.Heading>{t("title")}</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="text-foreground">
                            <ExtendedAccountPicker
                                accountId={accountId}
                                onAccountChange={setAccountId}
                            />
                        </Modal.Body>
                        <Modal.Footer>
                            <Button fullWidth variant="primary" onPress={() => onResult(accountId)}>
                                {t("btn")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
