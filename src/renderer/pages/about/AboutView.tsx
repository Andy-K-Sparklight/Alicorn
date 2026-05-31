import { cn, Pagination } from "@heroui/react";
import { AppInfo } from "@pages/about/AppInfo";
import { FeaturesInfo } from "@pages/about/FeaturesInfo";
import { PackagesInfo } from "@pages/about/PackagesInfo";
import { useState } from "react";

/**
 * The about page.
 */
export function AboutView() {
    const [page, setPage] = useState(1);

    const pages = [AppInfo, PackagesInfo, FeaturesInfo];

    const Page = pages[page - 1];

    return (
        <div className="flex flex-col w-full h-full justify-center gap-8">
            <div className="grow basis-2/3 min-h-0">
                <div className="m-auto flex flex-col justify-center gap-4 items-center w-3/4 h-full">
                    <Page />
                </div>
            </div>
            <Pagination>
                <Pagination.Content className="mx-auto mt-4">
                    <Pagination.Item>
                        <Pagination.Previous
                            isDisabled={page === 1}
                            onPress={() => setPage(p => Math.max(1, p - 1))}
                        >
                            <Pagination.PreviousIcon />
                        </Pagination.Previous>
                    </Pagination.Item>
                    {pages.map((_, i) => (
                        <Pagination.Item key={i}>
                            <Pagination.Link
                                className={cn(page === i + 1 && "bg-accent")}
                                isActive={page === i + 1}
                                onPress={() => setPage(i + 1)}
                            >
                                {i + 1}
                            </Pagination.Link>
                        </Pagination.Item>
                    ))}
                    <Pagination.Item>
                        <Pagination.Next
                            isDisabled={page === pages.length}
                            onPress={() => setPage(p => Math.min(pages.length, p + 1))}
                        >
                            <Pagination.NextIcon />
                        </Pagination.Next>
                    </Pagination.Item>
                </Pagination.Content>
            </Pagination>
        </div>
    );
}
