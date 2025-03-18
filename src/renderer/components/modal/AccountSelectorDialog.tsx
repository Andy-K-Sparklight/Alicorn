import { ExtendedAccountPicker } from "@components/compound/ExtendedAccountPicker";
import type { PropsWithDialog } from "@components/modal/DialogProvider";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function AccountSelectorDialog(props: PropsWithDialog<string, {}>) {
    const { t } = useTranslation("common", { keyPrefix: "account-selector-dialog" });
    const { onResult, isOpen } = props;
    const [accountId, setAccountId] = useState("new");
    return <Modal size="2xl" isOpen={isOpen} hideCloseButton isDismissable={false} isKeyboardDismissDisabled>
        <ModalContent>
            <ModalHeader>{t("title")}</ModalHeader>
            <ModalBody>
                <ExtendedAccountPicker accountId={accountId} onAccountChange={setAccountId}/>
            </ModalBody>
            <ModalFooter>
                <Button fullWidth color="primary" onPress={() => onResult(accountId)}>{t("btn")}</Button>
            </ModalFooter>
        </ModalContent>
    </Modal>;
}
