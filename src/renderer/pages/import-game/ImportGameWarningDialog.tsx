import { useNav } from "@/renderer/util/nav";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { GitPullRequestClosed } from "lucide-react";
import { useRef } from "react";
import { Trans, useTranslation } from "react-i18next";

export function ImportGameWarningDialog() {
    const { t } = useTranslation("pages", { keyPrefix: "import-game.warning" });
    const confirmed = useRef(false);
    const nav = useNav();

    function onCancel() {
        if (!confirmed.current) {
            nav("/games");
        }
    }

    return <Modal size="3xl" onClose={onCancel} defaultOpen>
        <ModalContent>
            {
                (onClose) => <>
                    <ModalHeader>{t("title")}</ModalHeader>
                    <ModalBody>
                        <div className="w-full flex items-center gap-8 px-4">
                            <div className="flex p-4 items-center rounded-full bg-danger-100 text-danger-500">
                                <GitPullRequestClosed size={36}/>
                            </div>

                            <p className="whitespace-pre-line w-full">
                                <Trans t={t} i18nKey="sub"/>
                            </p>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            fullWidth
                            color="danger"
                            onPress={() => {
                                confirmed.current = true;
                                onClose();
                            }}
                        >
                            {t("btn")}
                        </Button>
                    </ModalFooter>
                </>
            }
        </ModalContent>
    </Modal>;
}
