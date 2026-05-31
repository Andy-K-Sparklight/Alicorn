import { WizardCard } from "@components/display/WizardCard";
import { AccountPicker } from "@components/input/AccountPicker";
import { YggdrasilFormDialog } from "@components/modal/YggdrasilFormDialog";
import { Button } from "@heroui/react";
import { useCreateGameWizardContext } from "@pages/create-game-wizard/CreateGameWizardView";
import { CheckIcon, UserPlus2Icon } from "lucide-react";
import { nanoid } from "nanoid";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DetailedAccountProps } from "@/main/auth/types";
import { useNav } from "@/renderer/util/nav";

export function PickAccountView() {
    const { t } = useTranslation("pages", { keyPrefix: "create-game-wizard.pick-account" });
    const ctx = useCreateGameWizardContext();
    const nav = useNav();
    const [yggdrasilFormOpen, setYggdrasilFormOpen] = useState(false);
    const [yggdrasilFormKey, setYggdrasilFormKey] = useState("");
    const [accountId, setAccountId] = useState("new");

    function onConfirm() {
        ctx.setValue({ ...ctx.value, accountId });
        nav("/games/new-wizard/finish");
    }

    function handleAddYggdrasil() {
        setYggdrasilFormKey(nanoid());
        setYggdrasilFormOpen(true);
    }

    function onAccountAdded(a: DetailedAccountProps) {
        setAccountId(a.uuid);
    }

    return (
        <WizardCard
            title={t("title")}
            sub={t("sub")}
            content={
                <div className="flex flex-col gap-2 h-full">
                    <div className="text-sm text-muted whitespace-pre-line">{t("hint")}</div>

                    <div className="mt-auto">
                        <Button fullWidth variant="tertiary" onPress={handleAddYggdrasil}>
                            <UserPlus2Icon />
                            {t("add-yggdrasil")}
                        </Button>
                    </div>

                    <div>
                        <Button fullWidth onPress={onConfirm}>
                            <CheckIcon />
                            {t("btn")}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="w-full h-full overflow-y-auto flex">
                <div className="flex flex-col w-full gap-2 justify-center my-auto">
                    <AccountPicker accountId={accountId} onChange={setAccountId} allowCreation />
                </div>
            </div>

            <YggdrasilFormDialog
                key={yggdrasilFormKey}
                isOpen={yggdrasilFormOpen}
                onClose={() => setYggdrasilFormOpen(false)}
                onAccountAdded={onAccountAdded}
            />
        </WizardCard>
    );
}
