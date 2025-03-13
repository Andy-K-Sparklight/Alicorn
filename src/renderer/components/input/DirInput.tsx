import { Button, Input } from "@heroui/react";
import { EllipsisIcon } from "lucide-react";
import { useState } from "react";

interface DirInputProps {
    value: string;
    onChange: (pt: string) => void;
}

export function DirInput({ value, onChange }: DirInputProps) {
    const [internalValue, setInternalValue] = useState(value);

    async function runSelect() {
        const d = await native.ext.selectDir();
        if (d) {
            setInternalValue(d);
            onChange(d);
        }
    }

    return <div className="flex items-center gap-1">
        <Input fullWidth value={internalValue} onValueChange={setInternalValue} onBlur={() => onChange(internalValue)}/>
        <Button isIconOnly onPress={runSelect}>
            <EllipsisIcon/>
        </Button>
    </div>;
}
