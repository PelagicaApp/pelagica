import { useTranslation } from 'react-i18next';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationEllipsis,
} from '@/components/ui/pagination';
import FocusablePaginationLink from '@/components/FocusablePaginationLink';

interface ItemPaginationProps {
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

const ItemPagination = ({ totalPages, currentPage, onPageChange }: ItemPaginationProps) => {
    const { t } = useTranslation('common');
    if (totalPages <= 0) return null;

    return (
        <div className="my-4 md:mb-0">
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <FocusablePaginationLink
                            variant="previous"
                            text={t('previous')}
                            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                            className={
                                currentPage === 0
                                    ? 'pointer-events-none opacity-50'
                                    : 'cursor-pointer'
                            }
                        />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => {
                        if (
                            i === 0 ||
                            i === totalPages - 1 ||
                            (i >= currentPage - 1 && i <= currentPage + 1)
                        ) {
                            return (
                                <PaginationItem key={i}>
                                    <FocusablePaginationLink
                                        onClick={() => onPageChange(i)}
                                        isActive={i === currentPage}
                                        className="cursor-pointer"
                                    >
                                        {i + 1}
                                    </FocusablePaginationLink>
                                </PaginationItem>
                            );
                        } else if (
                            (i === 1 && currentPage > 2) ||
                            (i === totalPages - 2 && currentPage < totalPages - 3)
                        ) {
                            return (
                                <PaginationItem key={i}>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            );
                        }
                        return null;
                    })}
                    <PaginationItem>
                        <FocusablePaginationLink
                            variant="next"
                            text={t('next')}
                            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                            className={
                                currentPage >= totalPages - 1
                                    ? 'pointer-events-none opacity-50'
                                    : 'cursor-pointer'
                            }
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
};

export default ItemPagination;
