import type { ContinueWatchingDetailLine, ContinueWatchingTitleLine } from '@pelagica/core';
import { useContinueWatchingAndNextUp } from '@pelagica/core';
import { getUserId } from '@pelagica/core';
import BaseContinueRow from './BaseContinueRow';

interface ContinueWatchingRowProps {
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
    limit?: number;
    accurateSorting?: boolean;
}

const ContinueWatchingRow = ({
    title,
    titleLine,
    detailLine,
    limit,
    accurateSorting = true,
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
        />
    );
};

export default ContinueWatchingRow;
