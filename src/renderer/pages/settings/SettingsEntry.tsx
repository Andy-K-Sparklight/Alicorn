/**
 * Various entry widgets for manipulating the settings.
 */
import { Button, Input, Select, SelectItem, type SharedSelection, Slider, Switch } from "@heroui/react";
import { EllipsisIcon, PlusIcon, XIcon } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface SettingsEntryProps<T> {
    id: string;
    icon?: React.ComponentType;
    value: T;
    onChange: (value: T) => void;
}

/**
 * Gets translations for the entries.
 */
function useEntriesTrans() {
    return useTranslation("pages", { keyPrefix: "settings.entries" });
}

function Title({ id, icon: Icon }: { id: string, icon?: React.ComponentType }) {
    const { t } = useEntriesTrans();

    return <div className="flex gap-2 items-center">
        {Icon && <Icon/>}
        <div className="text-lg font-bold">{t(`${id}.title`)}</div>
    </div>;
}

function Subtitle({ id }: { id: string }) {
    const { t } = useEntriesTrans();

    return <div className="text-sm text-foreground-400 whitespace-pre-line">{t(`${id}.sub`)}</div>;
}

function EntryLabel({ id, icon }: { id: string; icon?: React.ComponentType }) {
    return <div className="flex flex-col gap-2">

        <Title id={id} icon={icon}/>
        <Subtitle id={id}/>
    </div>;
}

export function TextEntry({ id, icon, value, onChange }: SettingsEntryProps<string>) {
    return <div className="flex flex-col gap-2 w-full">
        <EntryLabel id={id} icon={icon}/>
        <Input fullWidth value={value} onValueChange={onChange}/>
    </div>;
}

export function DirEntry({ id, icon, value, onChange }: SettingsEntryProps<string>) {
    async function runSelect() {
        const d = await native.ext.selectDir();
        if (d) onChange(d);
    }

    return <div className="flex flex-col gap-2 w-full">
        <EntryLabel id={id} icon={icon}/>
        <div className="flex items-center gap-1">
            <Input fullWidth value={value} onValueChange={onChange}/>
            <Button isIconOnly onPress={runSelect}>
                <EllipsisIcon/>
            </Button>
        </div>
    </div>;
}

type NumberSliderEntryProps = SettingsEntryProps<number> & { max: number; min: number; }

export function NumberSliderEntry({ id, icon, value, onChange, max, min }: NumberSliderEntryProps) {
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
}

export function StringArrayEntry({ id, icon, value, onChange }: SettingsEntryProps<string[]>) {
    const [str, setStr] = useState("");
    const { t } = useTranslation("pages", { keyPrefix: "settings" });

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

        {
            str &&
            <div className="text-sm text-secondary">{t("input-blur-to-add")}</div>
        }
    </div>;
}

export function OnOffEntry({ id, icon, value, onChange }: SettingsEntryProps<boolean>) {
    return <div className="flex flex-col gap-2 w-full">
        <Title id={id} icon={icon}/>

        <div className="flex gap-2 items-center">
            <Switch size="sm" isSelected={value} onValueChange={onChange}/>
            <Subtitle id={id}/>
        </div>
    </div>;
}


type SelectEntryProps<T> = SettingsEntryProps<T> & { items: T[] }

export function SelectEntry({ id, icon, value, onChange, items }: SelectEntryProps<string>) {
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
}
