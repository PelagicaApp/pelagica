import {
    getUserId,
    useNextUp,
    type ContinueWatchingDetailLine,
    type ContinueWatchingTitleLine,
} from '@pelagica/core';
import BaseContinueRow from './BaseContinueRow';

const NextUpRow = ({
    limit,
    title,
    titleLine,
    detailLine,
}: {
    limit?: number;
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
}) => {
    const { data: nextUpData, isLoading, error } = useNextUp(getUserId(), limit);

    return (
        <BaseContinueRow
            items={nextUpData || []}
            isLoading={isLoading}
            error={error}
            title={title}
            titleLine={titleLine}
            detailLine={detailLine}
        />
    );
};

export default NextUpRow;
