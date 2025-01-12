/**
 * Various entry widgets for manipulating the settings.
 */
import { Input, Select, SelectItem, type SharedSelection, Switch } from "@nextui-org/react";
import type { Icon } from "@primer/octicons-react";
import React, { type FC } from "react";
import { useTranslation } from "react-i18next";

interface SettingsEntryProps<T> {
    id: string;
    icon?: Icon;
    value: T;
    onChange: (value: T) => void;
}

const Title = ({ id, icon }: { id: string, icon?: Icon }) => {
    const { t } = useTranslation("pages", { keyPrefix: "settings.entries" });

    return <div className="flex gap-2 items-center">
        {icon && React.createElement(icon)}
        <div className="text-lg font-bold">{t(`${id}.title`)}</div>
    </div>;
};

const Subtitle = ({ id }: { id: string }) => {
    const { t } = useTranslation("pages", { keyPrefix: "settings.entries" });

    return <div className="text-sm text-foreground-400">{t(`${id}.sub`)}</div>;
};

const EntryLabel = ({ id, icon }: { id: string; icon?: Icon }) => {
    return <div className="flex flex-col gap-2">

        <Title id={id} icon={icon}/>
        <Subtitle id={id}/>
    </div>;
};

export const TextEntry: FC<SettingsEntryProps<string>> = ({ id, icon, value, onChange }) => {
    return <div className="flex flex-col gap-2 w-full">
        <EntryLabel id={id} icon={icon}/>
        <Input fullWidth value={value} onValueChange={onChange}/>
    </div>;
};

export const OnOffEntry: FC<SettingsEntryProps<boolean>> = ({ id, icon, value, onChange }) => {
    return <div className="flex flex-col gap-2 w-full">

        <Title id={id} icon={icon}/>

        <div className="flex gap-2 items-center">
            <Switch size="sm" isSelected={value} onValueChange={onChange}/>
            <Subtitle id={id}/>
        </div>
    </div>;
};


type SelectEntryProps = SettingsEntryProps<string> & { items: string[] }

export const SelectEntry: FC<SelectEntryProps> = ({ id, icon, value, onChange, items }) => {
    const { t } = useTranslation("pages", { keyPrefix: "settings.entries" });

    function handleSelectionChange(s: SharedSelection) {
        if (s instanceof Set && s.size > 0) {
            onChange([...s][0].toString());
        }
    }

    return <div className="flex flex-col gap-2 w-full">
        <EntryLabel id={id} icon={icon}/>

        <Select aria-label="Selection" fullWidth selectedKeys={[value]} onSelectionChange={handleSelectionChange}>
            {
                items.map(item => <SelectItem key={item}>{t(`${id}.items.${item}`)}</SelectItem>)
            }
        </Select>
    </div>;
};