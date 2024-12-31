import React, { type FC, useState } from "react";
import { Pagination } from "@nextui-org/react";
import { AppInfoPage } from "@pages/about/AppInfo";

/**
 * The about page.
 */
export const About: FC = () => {
    const [page, setPage] = useState(1);

    const pages = [
        AppInfoPage
    ];

    return <div className="flex flex-col w-full h-full justify-center items-center gap-8">
        <div className="flex overflow-y-auto basis-2/3 w-full">
            {React.createElement(pages[page - 1])}
        </div>
        <Pagination showControls initialPage={1} total={pages.length} page={page} onChange={setPage}/>
    </div>;
};

