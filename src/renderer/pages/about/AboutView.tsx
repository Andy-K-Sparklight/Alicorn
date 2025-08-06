import { Pagination } from "@heroui/react";
import { AppInfo } from "@pages/about/AppInfo";
import { FeaturesInfo } from "@pages/about/FeaturesInfo";
import { PackagesInfo } from "@pages/about/PackagesInfo";
import React, { useState } from "react";

/**
 * The about page.
 */
export function AboutView() {
    const [page, setPage] = useState(1);

    const pages = [
        AppInfo,
        PackagesInfo,
        FeaturesInfo
    ];

    const Page = pages[page - 1];

    return <div className="flex flex-col w-full h-full justify-center gap-8">
        <div className="grow basis-2/3 min-h-0">
            <div className="m-auto flex flex-col justify-center gap-4 items-center w-3/4 h-full">
                <Page/>
            </div>
        </div>
        <Pagination
            classNames={{
                // A workaround for the incorrectly colored cursor
                cursor: "opacity-100"
            }}
            className="mx-auto"
            showControls
            initialPage={1}
            total={pages.length}
            page={page}
            onChange={setPage}
        />
    </div>;
}
