/**
 * Various entry widgets for manipulating the settings.
 */
import { Button, Input, Select, SelectItem, type SharedSelection, Slider, Switch, Textarea } from "@heroui/react";
import { type Icon, KebabHorizontalIcon } from "@primer/octicons-react";
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

    return <div className="text-sm text-foreground-400 whitespace-pre-line">{t(`${id}.sub`)}</div>;
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

export const NumberTextEntry: FC<SettingsEntryProps<number>> = ({ id, icon, value, onChange }) => {
    return <div className="flex flex-col gap-2 w-full">
        <EntryLabel id={id} icon={icon}/>
        <Input fullWidth type="number" value={value.toString()}
               onValueChange={(s) => onChange(parseInt(s || "0", 10))}/>
    </div>;
};


type NumberSliderEntryProps = SettingsEntryProps<number> & { max: number; min: number; }

export const NumberSliderEntry: FC<NumberSliderEntryProps> = ({ id, icon, value, onChange, max, min }) => {
    return <div className="flex flex-col gap-4 w-full">
        <EntryLabel id={id} icon={icon}/>
        <Slider maxValue={max} minValue={min} value={value} hideThumb
                showTooltip
                aria-label="Number Slider"
                tooltipProps={{ size: "lg", radius: "full" }}
                startContent={<span className="text-foreground-400">{min}</span>}
                endContent={<span className="text-foreground-400">{max}</span>}
                onChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}/>
    </div>;
};


export const MultilineTextEntry: FC<SettingsEntryProps<string>> = ({ id, icon, value, onChange }) => {
    return <div className="flex flex-col gap-2 w-full">
        <EntryLabel id={id} icon={icon}/>
        <Textarea fullWidth value={value} onValueChange={onChange}/>
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