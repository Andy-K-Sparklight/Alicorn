import { AccountPicker } from "@components/input/AccountPicker";
import { YggdrasilFormDialog } from "@components/modal/YggdrasilFormDialog";
import { Button, cn } from "@heroui/react";
import { UserPlus2Icon } from "lucide-react";
import { nanoid } from "nanoid";
import { type HTMLProps, useState } from "react";
import { useTranslation } from "react-i18next";

interface ExtendedAccountPickerProps extends HTMLProps<HTMLDivElement> {
    accountId: string | null;
    onAccountChange: (accountId: string) => void;
}

export function ExtendedAccountPicker({
    accountId,
    onAccountChange,
    className,
}: ExtendedAccountPickerProps) {
    const { t } = useTranslation("common", { keyPrefix: "account-picker" });
    const [formOpen, setFormOpen] = useState(false);
    const [formKey, setFormKey] = useState("");

    function openForm() {
        setFormKey(nanoid());
        setFormOpen(true);
    }

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <AccountPicker allowCreation accountId={accountId} onChange={onAccountChange} />
            <Button onPress={openForm} variant="tertiary" fullWidth>
                <UserPlus2Icon />
                {t("add-yggdrasil")}
            </Button>
            <YggdrasilFormDialog
                key={formKey}
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
            />
        </div>
    );
}
