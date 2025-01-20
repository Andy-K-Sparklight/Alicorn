/**
 * Various entry widgets for manipulating the settings.
 */
import { Button, Input, Select, SelectItem, type SharedSelection, Slider, Switch } from "@heroui/react";
import { type Icon, KebabHorizontalIcon, PlusIcon, XIcon } from "@primer/octicons-react";
import React, { type FC, useState } from "react";
import { useTranslation } from "react-i18next";

interface SettingsEntryProps<T> {
    id: string;
    icon?: Icon;
    value: T;
    onChange: (value: T) => void;
}

/**
 * Gets translations for the entries.
 */
function useEntriesTrans() {
    return useTranslation("pages", { keyPrefix: "settings.entries" });
}

const Title = ({ id, icon }: { id: string, icon?: Icon }) => {
    const { t } = useEntriesTrans();

    return <div className="flex gap-2 items-center">
        {icon && React.createElement(icon)}
        <div className="text-lg font-bold">{t(`${id}.title`)}</div>
    </div>;
};

const Subtitle = ({ id }: { id: string }) => {
    const { t } = useEntriesTrans();

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

export const DirEntry: FC<SettingsEntryProps<string>> = ({ id, icon, value, onChange }) => {
    async function runSelect() {
        const d = await native.ext.selectDir();
        if (d) onChange(d);
    }

    return <div className="flex flex-col gap-2 w-full">
        <EntryLabel id={id} icon={icon}/>
        <div className="flex items-center gap-1">
            <Input fullWidth value={value} onValueChange={onChange}/>
            <Button isIconOnly onPress={runSelect}>
                <KebabHorizontalIcon/>
            </Button>
        </div>
    </div>;
};

type NumberSliderEntryProps = SettingsEntryProps<number> & { max: number; min: number; }

export const NumberSliderEntry: FC<NumberSliderEntryProps> = ({ id, icon, value, onChange, max, min }) => {
    return <div className="flex flex-col gap-4 w-full">
        <EntryLabel id={id} icon={icon}/>
        <Slider
            maxValue={max}
            minValue={min}
            value={value}
            hideThumb
            showTooltip
            aria-label="Number Slider"
            tooltipProps={{ size: "lg", radius: "full" }}
            startContent={min}
            endContent={max}
            onChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        />
    </div>;
};

export const StringArrayEntry: FC<SettingsEntryProps<string[]>> = ({ id, icon, value, onChange }) => {
    const [str, setStr] = useState("");

    function addItem() {
        const s = str.trim();
        if (s) {
            const d = [...value, s];
            onChange(d);
            setStr("");
        }
    }

    function removeItem(i: number) {
        const d = value.slice(0, i).concat(value.slice(i + 1));
        onChange(d);
    }

    return <div className="flex flex-col gap-2 w-full">
        <EntryLabel id={id} icon={icon}/>

        {
            value.map((s, i) =>
                <div key={i} className="mt-2 flex items-center gap-2">
                    <div
                        className="cursor-pointer"
                        onClick={() => removeItem(i)}
                    >
                        <XIcon className="text-foreground-400"/>
                    </div>

                    <div className="text-sm">
                        {s}
                    </div>
                </div>
            )
        }

        <div className="flex items-center gap-1 mt-2">
            <Input fullWidth value={str} onValueChange={setStr} onBlur={addItem}/>
            <Button isIconOnly onPress={addItem}>
                <PlusIcon/>
            </Button>
        </div>
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
    const { t } = useEntriesTrans();

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
