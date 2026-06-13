/**
 * Various entry widgets for manipulating the settings.
 */
import { FileSelectInput } from "@components/input/FileSelectInput";
import { StringArrayInput } from "@components/input/StringArrayInput";
import { Button, Input, ListBox, Select, Slider, Switch } from "@heroui/react";
import { MinusIcon, PlusIcon } from "lucide-react";
import type React from "react";
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

function Title({ id, icon: Icon }: { id: string; icon?: React.ComponentType }) {
    const { t } = useEntriesTrans();

    return (
        <div className="flex gap-2 items-center">
            {Icon && <Icon />}
            <div className="text-lg font-bold">{t(`${id}.title`)}</div>
        </div>
    );
}

function Subtitle({ id }: { id: string }) {
    const { t } = useEntriesTrans();

    return <div className="text-sm text-muted whitespace-pre-line">{t(`${id}.sub`)}</div>;
}

function EntryLabel({ id, icon }: { id: string; icon?: React.ComponentType }) {
    return (
        <div className="flex flex-col gap-2">
            <Title id={id} icon={icon} />
            <Subtitle id={id} />
        </div>
    );
}

export function TextEntry({ id, icon, value, onChange }: SettingsEntryProps<string>) {
    return (
        <div className="flex flex-col gap-2 w-full">
            <EntryLabel id={id} icon={icon} />
            <Input fullWidth defaultValue={value} onBlur={e => onChange(e.target.value)} />
        </div>
    );
}

export function DirEntry({ id, icon, value, onChange }: SettingsEntryProps<string>) {
    return (
        <div className="flex flex-col gap-2 w-full">
            <EntryLabel id={id} icon={icon} />
            <FileSelectInput value={value} onChange={onChange} />
        </div>
    );
}

interface ActionEntryProps {
    id: string;
    icon?: React.ComponentType;
    onClick: () => void;
}

export function ActionEntry({ id, icon, onClick }: ActionEntryProps) {
    const { t } = useEntriesTrans();

    return (
        <div className="flex flex-col gap-2 w-full">
            <EntryLabel id={id} icon={icon} />
            <div>
                <Button onPress={() => onClick()}>{t(`${id}.action`)}</Button>
            </div>
        </div>
    );
}

type NumberTuningEntryProps = SettingsEntryProps<number> & {
    max: number;
    min: number;
    step?: number;
    toLabel?: (v: number) => string;
};

export function NumberTuningEntry({
    id,
    icon,
    value,
    onChange,
    max,
    min,
    step,
    toLabel,
}: NumberTuningEntryProps) {
    function handleAdd() {
        const nv = value + (step ?? 1);
        if (nv <= max) {
            onChange(nv);
        }
    }

    function handleSubtract() {
        const nv = value - (step ?? 1);
        if (nv >= min) {
            onChange(nv);
        }
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <EntryLabel id={id} icon={icon} />

            <div className="flex gap-4 items-center">
                <Button isIconOnly size="sm" onPress={handleSubtract}>
                    <MinusIcon />
                </Button>
                {toLabel ? toLabel(value) : value}
                <Button isIconOnly size="sm" onPress={handleAdd}>
                    <PlusIcon />
                </Button>
            </div>
        </div>
    );
}

type NumberSliderEntryProps = SettingsEntryProps<number> & {
    max: number;
    min: number;
    step?: number;
};

export function NumberSliderEntry({
    id,
    icon,
    value,
    onChange,
    max,
    min,
    step,
}: NumberSliderEntryProps) {
    return (
        <div className="flex flex-col gap-4 w-full">
            <EntryLabel id={id} icon={icon} />
            <Slider
                step={step ?? 1}
                maxValue={max}
                minValue={min}
                value={value}
                onChange={v => onChange(Array.isArray(v) ? v[0] : v)}
            >
                <div className="flex gap-4 items-center">
                    <Slider.Track>
                        <Slider.Fill />
                        <Slider.Thumb />
                    </Slider.Track>
                    <Slider.Output />
                </div>
            </Slider>
        </div>
    );
}

export function StringArrayEntry({ id, icon, value, onChange }: SettingsEntryProps<string[]>) {
    return (
        <div className="flex flex-col gap-2 w-full">
            <EntryLabel id={id} icon={icon} />
            <StringArrayInput value={value} onChange={onChange} />
        </div>
    );
}

export function OnOffEntry({ id, icon, value, onChange }: SettingsEntryProps<boolean>) {
    return (
        <div className="flex flex-col gap-2 w-full">
            <Title id={id} icon={icon} />

            <div className="flex gap-2 items-center">
                <Switch size="sm" isSelected={value} onChange={onChange}>
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                </Switch>
                <Subtitle id={id} />
            </div>
        </div>
    );
}

type SelectEntryProps<T> = SettingsEntryProps<T> & { items: T[] };

export function SelectEntry({ id, icon, value, onChange, items }: SelectEntryProps<string>) {
    const { t } = useEntriesTrans();

    return (
        <div className="flex flex-col gap-2 w-full">
            <EntryLabel id={id} icon={icon} />

            <Select value={value} onChange={item => onChange(String(item))}>
                <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                    <ListBox>
                        {items.map(item => (
                            <ListBox.Item key={item} id={item} textValue={t(`${id}.items.${item}`)}>
                                {t(`${id}.items.${item}`)}
                                <ListBox.ItemIndicator />
                            </ListBox.Item>
                        ))}
                    </ListBox>
                </Select.Popover>
            </Select>
        </div>
    );
}
