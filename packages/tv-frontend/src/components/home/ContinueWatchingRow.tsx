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
    useSeriesImage,
}: {
    limit?: number;
    accurateSorting?: boolean;
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
    useSeriesImage?: boolean;
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
            useSeriesImage={useSeriesImage}
        />
    );
};

export default ContinueWatchingRow;
