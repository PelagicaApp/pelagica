import type { ContinueWatchingDetailLine, ContinueWatchingTitleLine } from '@pelagica/core';
import { useNextUp } from '@pelagica/core';
import { getUserId } from '@pelagica/core';
import BaseContinueRow from './BaseContinueRow';

interface NextUpRowProps {
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
    limit?: number;
}
export function NextUpRow({ title, titleLine, detailLine, limit }: NextUpRowProps) {
    const { data: nextUpData, isLoading, error } = useNextUp(getUserId(), limit);

    return (
        <BaseContinueRow
            title={title}
            titleLine={titleLine}
            detailLine={detailLine}
            items={nextUpData || []}
            isLoading={isLoading}
            error={error}
        />
    );
}

export default NextUpRow;
