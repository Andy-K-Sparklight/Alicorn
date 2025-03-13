import { useNav } from "@/renderer/util/nav";
import { MessageBox } from "@components/modal/MessageBox";
import { Button } from "@heroui/react";
import { GitPullRequestClosed } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

export function ImportGameWarningDialog() {
    const { t } = useTranslation("pages", { keyPrefix: "import-game.warning" });
    const nav = useNav();
    const [isOpen, setOpen] = useState(true);

    function onUserClose() {
        setOpen(false);
        nav("/games");
    }

    return <MessageBox
        title={t("title")}
        icon={<GitPullRequestClosed size={36}/>}
        color="danger"
        isOpen={isOpen}
        onClose={onUserClose}
        footer={
            <Button fullWidth color="danger" onPress={() => setOpen(false)}>
                {t("btn")}
            </Button>
        }
    >
        <p className="whitespace-pre-line w-full">
            <Trans t={t} i18nKey="sub"/>
        </p>
    </MessageBox>;
}
