import type React from "react";
import type { PropsWithChildren } from "react";

interface WizardCardProps {
    title: string;
    sub: string;
    content?: React.ReactNode;
}

export function WizardCard({ title, sub, content, children }: PropsWithChildren<WizardCardProps>) {
    return (
        <div className="flex w-full h-full px-8 py-4">
            <div className="grow flex rounded-3xl overflow-hidden">
                <div className="bg-surface-secondary flex flex-col gap-10 p-12">
                    <h1 className="font-bold text-3xl">{title}</h1>
                    <p className="text-base text-muted whitespace-pre-line">{sub}</p>
                    {content}
                </div>
                <div className="grow p-8 bg-surface">{children}</div>
            </div>
        </div>
    );
}
