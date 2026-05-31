import { Button, Input } from "@heroui/react";
import { EllipsisIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface FileSelectInputProps {
    value: string;
    onChange: (pt: string) => void;
    selector?: () => string | Promise<string>;
}

export function FileSelectInput({ value, onChange, selector }: FileSelectInputProps) {
    const [internalValue, setInternalValue] = useState(value);

    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    async function runSelect() {
        const d = await (selector ? selector() : native.ext.selectDir());
        if (d) {
            setInternalValue(d);
            onChange(d);
        }
    }

    return (
        <div className="flex items-center gap-1">
            <Input
                fullWidth
                value={internalValue}
                onChange={e => setInternalValue(e.target.value)}
                onBlur={() => onChange(internalValue)}
            />
            <Button className="shrink-0" isIconOnly onPress={runSelect}>
                <EllipsisIcon />
            </Button>
        </div>
    );
}
