import { nanoid } from "nanoid";
import React, { type PropsWithChildren, useContext, useRef, useState } from "react";

export interface DialogProps<T> {
    isOpen: boolean;
    onResult: (v: T) => void;
}

export type PropsWithDialog<T, P> = DialogProps<T> & P;

interface DialogProviderProps<T, P> {
    dialogProps: P;
    component: React.ComponentType<PropsWithDialog<T, P>>;
}

interface DialogProviderContextContent<T> {
    openDialog: () => Promise<T>;
}

const DialogProviderContext = React.createContext<DialogProviderContextContent<unknown> | null>(null);

export function DialogProvider<T, P>(props: PropsWithChildren<DialogProviderProps<T, P>>) {
    const [open, setOpen] = useState(false);
    const [key, setKey] = useState(nanoid());
    const resolver = useRef<((v: T) => void) | null>(null);

    function handleResult(v: T) {
        if (resolver.current) {
            resolver.current(v);
            resolver.current = null;
            setOpen(false);
        }
    }

    function openDialog() {
        setKey(nanoid());
        setOpen(true);
        return new Promise<T>(res => {
            resolver.current = res;
        });
    }

    const contextValue: DialogProviderContextContent<T> = { openDialog };

    const DialogComponent = props.component;

    return <DialogProviderContext.Provider value={contextValue}>
        {props.children}
        <DialogComponent {...props.dialogProps} key={key} isOpen={open} onResult={handleResult}/>
    </DialogProviderContext.Provider>;
}

export function useOpenDialog<T>(): () => Promise<T> {
    const ctx = useContext(DialogProviderContext);
    if (!ctx) return () => Promise.reject("Parent dialog context not found");

    return ctx.openDialog as () => Promise<T>;
}
