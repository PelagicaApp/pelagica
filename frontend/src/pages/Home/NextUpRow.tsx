import type { ContinueWatchingDetailLine, ContinueWatchingTitleLine } from '@pelagica/core';
import { useNextUp } from '@pelagica/core';
import { getUserId } from '@pelagica/core';
import BaseContinueRow from './BaseContinueRow';

interface NextUpRowProps {
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
    useSeriesImage?: boolean;
    limit?: number;
}
export function NextUpRow({ title, titleLine, detailLine, useSeriesImage, limit }: NextUpRowProps) {
    const { data: nextUpData, isLoading, error } = useNextUp(getUserId(), limit);

    return (
        <BaseContinueRow
            title={title}
            titleLine={titleLine}
            detailLine={detailLine}
            useSeriesImage={useSeriesImage}
            items={nextUpData || []}
            isLoading={isLoading}
            error={error}
        />
    );
}

export default NextUpRow;
