import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize = 10,
    onPageChange,
    isLoading = false,
}: PaginationProps) {
    if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
        return null;
    }

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show page 1
            pages.push(1);

            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                start = 2;
                end = 4;
            } else if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
                end = totalPages - 1;
            }

            if (start > 2) {
                pages.push("...");
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages - 1) {
                pages.push("...");
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : undefined;
    const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 font-sans border-t border-border mt-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
                {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
                    <span>
                        Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
                        <span className="font-medium text-foreground">{endItem}</span> of{" "}
                        <span className="font-medium text-foreground">{totalItems}</span> entries
                    </span>
                ) : (
                    <span>
                        Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
                        <span className="font-medium text-foreground">{totalPages}</span>
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="h-9 px-3 gap-1"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => {
                        if (page === "...") {
                            return (
                                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground select-none">
                                    …
                                </span>
                            );
                        }

                        const pageNum = Number(page);
                        const isActive = pageNum === currentPage;

                        return (
                            <Button
                                key={`page-${pageNum}`}
                                variant={isActive ? "default" : "outline"}
                                size="sm"
                                onClick={() => onPageChange(pageNum)}
                                disabled={isLoading}
                                className={`h-9 w-9 p-0 font-medium ${
                                    isActive ? "pointer-events-none" : "hover:bg-muted"
                                }`}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                    className="h-9 px-3 gap-1"
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
