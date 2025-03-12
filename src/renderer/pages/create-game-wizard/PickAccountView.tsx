import type { DetailedAccountProps } from "@/main/auth/types";
import { useNav } from "@/renderer/util/nav";
import { AccountPicker } from "@components/AccountPicker";
import { WizardCard } from "@components/WizardCard";
import { YggdrasilFormDialog } from "@components/YggdrasilFormDialog";
import { Button } from "@heroui/react";
import { useCreateGameWizardContext } from "@pages/create-game-wizard/CreateGameWizardView";
import { CheckIcon, UserPlus2Icon } from "lucide-react";
import { nanoid } from "nanoid";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export function PickAccountView() {
    const { t } = useTranslation("pages", { keyPrefix: "create-game-wizard.pick-account" });
    const ctx = useCreateGameWizardContext();
    const nav = useNav();
    const [yggdrasilFormOpen, setYggdrasilFormOpen] = useState(false);
    const [yggdrasilFormKey, setYggdrasilFormKey] = useState("");
    const [accountId, setAccountId] = useState("new");

    function onConfirm() {
        ctx.setValue({ ...ctx.value, authType: "online", accountId: accountId === "new" ? "" : accountId });
        nav("/games/new-wizard/finish");
    }

    function handleAddYggdrasil() {
        setYggdrasilFormKey(nanoid());
        setYggdrasilFormOpen(true);
    }

    function onAccountAdded(a: DetailedAccountProps) {
        setAccountId(a.uuid);
    }

    return <WizardCard
        title={t("title")}
        sub={t("sub")}
        content={
            <div className="flex flex-col gap-2 h-full">
                <div className="text-sm text-foreground-500 whitespace-pre-line">
                    {t("hint")}
                </div>

                <div className="mt-auto">
                    <Button
                        fullWidth
                        startContent={<UserPlus2Icon/>}
                        onPress={handleAddYggdrasil}
                    >
                        {t("add-yggdrasil")}
                    </Button>
                </div>

                <div>
                    <Button
                        fullWidth
                        startContent={<CheckIcon/>}
                        onPress={onConfirm}
                        color="primary"
                    >
                        {t("btn")}
                    </Button>
                </div>
            </div>
        }
    >
        <div className="w-full h-full overflow-y-auto flex">
            <div className="flex flex-col w-full gap-2 justify-center my-auto">
                <AccountPicker accountId={accountId} onChange={setAccountId} allowCreation/>
            </div>
        </div>

        <YggdrasilFormDialog
            key={yggdrasilFormKey}
            isOpen={yggdrasilFormOpen}
            onClose={() => setYggdrasilFormOpen(false)}
            onAccountAdded={onAccountAdded}
        />
    </WizardCard>;
}
