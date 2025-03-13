import { Input } from "@heroui/react";
import React, { type PropsWithChildren, useEffect, useRef, useState } from "react";

interface EditableProps {
    value: string;
    onValueChange: (v: string) => void;
    inputProps?: Parameters<typeof Input>[0];
}

export function Editable({ value, onValueChange, children, inputProps }: PropsWithChildren<EditableProps>) {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) {
            inputRef?.current?.focus();
        }
    }, [inputRef, editing]);

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
        onValueChange(e.target.value);
        setEditing(false);
    }

    if (!editing) {
        return <span onClick={() => setEditing(true)}>{children}</span>;
    }

    return <Input
        ref={inputRef}
        autoFocus
        variant="bordered"
        defaultValue={value}
        onBlur={handleBlur}
        {...inputProps}
    />;
}
