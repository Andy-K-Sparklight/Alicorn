import { Pagination } from "@heroui/react";
import { AppInfo } from "@pages/about/AppInfo";
import { FeaturesInfo } from "@pages/about/FeaturesInfo";
import { PackagesInfo } from "@pages/about/PackagesInfo";
import React, { type FC, useState } from "react";

/**
 * The about page.
 */
export const About: FC = () => {
    const [page, setPage] = useState(1);

    const pages = [
        AppInfo,
        PackagesInfo,
        FeaturesInfo
    ];

    return <div className="flex flex-col w-full h-full justify-center items-center gap-8">
        <div className="grow flex basis-2/3 w-full min-h-0">
            <div className="m-auto flex flex-col justify-center gap-4 items-center w-3/4 h-full">
                {React.createElement(pages[page - 1])}
            </div>
        </div>
        <Pagination showControls initialPage={1} total={pages.length} page={page} onChange={setPage}/>
    </div>;
};

