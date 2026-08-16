import {
    getUserId,
    useContinueWatchingAndNextUp,
    type ContinueWatchingDetailLine,
    type ContinueWatchingTitleLine,
} from '@pelagica/core';
import BaseContinueRow from './BaseContinueRow';

const ContinueWatchingRow = ({
    limit,
    accurateSorting = true,
    title,
    titleLine,
    detailLine,
}: {
    limit?: number;
    accurateSorting?: boolean;
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
}) => {
    const {
        data: continueWatchingData,
        isLoading,
        error,
    } = useContinueWatchingAndNextUp(getUserId(), limit, accurateSorting);

    return (
        <BaseContinueRow
            items={continueWatchingData?.items || []}
            isLoading={isLoading}
            error={error}
            title={title}
            titleLine={titleLine}
            detailLine={detailLine}
        />
    );
};

export default ContinueWatchingRow;
