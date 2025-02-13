import { Button, Input } from "@heroui/react";
import { EllipsisIcon } from "lucide-react";
import React from "react";

interface DirInputProps {
    value: string;
    onChange: (pt: string) => void;
}

export function DirInput({ value, onChange }: DirInputProps) {
    async function runSelect() {
        const d = await native.ext.selectDir();
        if (d) onChange(d);
    }

    return <div className="flex items-center gap-1">
        <Input fullWidth value={value} onValueChange={onChange}/>
        <Button isIconOnly onPress={runSelect}>
            <EllipsisIcon/>
        </Button>
    </div>;
}
