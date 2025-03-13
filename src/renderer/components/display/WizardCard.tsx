import React, { type PropsWithChildren } from "react";

interface WizardCardProps {
    title: string;
    sub: string;
    content?: React.ReactNode;
}


export function WizardCard({ title, sub, content, children }: PropsWithChildren<WizardCardProps>) {
    return <div className="flex w-full h-full px-8 py-4">
        <div className="grow flex rounded-3xl overflow-hidden">
            <div className="bg-content2 flex flex-col gap-10 p-12">
                <h1 className="font-bold text-3xl">{title}</h1>
                <p className="text-medium text-foreground-500 whitespace-pre-line">{sub}</p>
                {content}
            </div>
            <div className="grow p-8 bg-content1">
                {children}
            </div>
        </div>
    </div>;
}
