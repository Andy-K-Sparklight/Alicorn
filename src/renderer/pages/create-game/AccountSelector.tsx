import { useAccounts } from "@/renderer/services/auth";
import { Select, SelectItem, type SharedSelection } from "@heroui/react";
import { useTranslation } from "react-i18next";

interface AccountSelectorProps {
    enabled: boolean;
    accountId: string | null;
    onChange: (accountId: string | null) => void;
}

export function AccountSelector({ enabled, accountId, onChange }: AccountSelectorProps) {
    const { t } = useTranslation("pages", { keyPrefix: "create-game" });
    const accounts = useAccounts();

    function handleSelectionChange(k: SharedSelection) {
        if (k instanceof Set) {
            onChange([...k][0]?.toString() ?? null);
        }
    }

    return <Select
        label={t("account.select.label")}
        placeholder={t("account.select.placeholder")}
        isDisabled={!enabled}
        selectedKeys={accountId ? [accountId] : []}
        onSelectionChange={handleSelectionChange}
    >
        {
            accounts.map(a =>
                <SelectItem key={a.uuid} textValue={a.playerName}>
                    <div className="flex items-center gap-1">
                        <div>{a.playerName}</div>
                        <div className="text-default-400">{a.uuid}</div>
                    </div>
                </SelectItem>
            )
        }
    </Select>;
}
