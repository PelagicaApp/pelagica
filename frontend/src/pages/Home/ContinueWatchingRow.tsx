import type { ContinueWatchingDetailLine, ContinueWatchingTitleLine } from '@/hooks/api/useConfig';
import { useContinueWatchingAndNextUp } from '@/hooks/api/continue/useContinueWatchingAndNextUp';
import { getUserId } from '@/utils/localstorageCredentials';
import BaseContinueRow from './BaseContinueRow';

interface ContinueWatchingRowProps {
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
    limit?: number;
    accurateSorting?: boolean;
    contentInset?: number;
}

const ContinueWatchingRow = ({
    title,
    titleLine,
    detailLine,
    limit,
    accurateSorting = true,
    contentInset,
}: ContinueWatchingRowProps) => {
    const {
        data: continueWatchingData,
        isLoading,
        error,
    } = useContinueWatchingAndNextUp(getUserId(), limit, accurateSorting);

    return (
        <BaseContinueRow
            title={title}
            titleLine={titleLine}
            detailLine={detailLine}
            items={continueWatchingData?.items || []}
            isLoading={isLoading}
            error={error}
            contentInset={contentInset}
        />
    );
};

export default ContinueWatchingRow;
