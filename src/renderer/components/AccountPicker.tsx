import { useAccounts } from "@/renderer/services/accounts";
import { CardRadio } from "@components/CardRadio";
import { SkinAvatar } from "@components/SkinAvatar";
import { RadioGroup } from "@heroui/radio";
import { Skeleton } from "@heroui/react";
import { UserPlus2Icon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface AccountSelectorProps {
    accountId: string | null;
    allowCreation?: boolean;
    onChange: (accountId: string) => void;
}

export function AccountPicker({ accountId, allowCreation, onChange }: AccountSelectorProps) {
    const { t } = useTranslation("common", { keyPrefix: "account-picker" });
    const accounts = useAccounts();

    return <RadioGroup value={accountId} onValueChange={onChange}>
        {
            allowCreation &&
            <PickEntry
                value="new"
                title={t("new.title")}
                sub={t("new.sub")}
                icon={<UserPlus2Icon className="w-full h-full"/>}
            />
        }

        {
            accounts.map(a =>
                <PickEntry
                    key={a.uuid}
                    value={a.uuid}
                    title={a.playerName}
                    sub={a.uuid}
                    icon={<AccountSkinAvatar accountId={a.uuid}/>}
                />
            )
        }
    </RadioGroup>;
}

interface PickEntryProps {
    value: string;
    title: string;
    sub: string;
    icon: React.ReactNode;
}

function PickEntry({ icon, value, title, sub }: PickEntryProps) {
    return <CardRadio value={value}>
        <div className="flex gap-4 items-center">
            <div className="w-12 h-12 shrink-0 p-1">
                {icon}
            </div>

            <div className="flex flex-col gap-1">
                <div>{title}</div>
                <div className="text-sm text-foreground-400">{sub}</div>
            </div>
        </div>
    </CardRadio>;
}

function AccountSkinAvatar({ accountId }: { accountId: string }) {
    const [skinUrls, setSkinUrls] = useState<[string, string] | null>(null);

    useEffect(() => {
        native.auth.getSkinAvatar(accountId).then(setSkinUrls);
    }, [accountId]);

    if (!skinUrls) {
        return <Skeleton className="w-full h-full rounded-sm"/>;
    }

    return <SkinAvatar avatarSrc={skinUrls}/>;
}
