import { useResumeItems } from '@pelagica/core';
import type { ContinueWatchingDetailLine, ContinueWatchingTitleLine } from '@pelagica/core';
import { getUserId } from '@pelagica/core';
import BaseContinueRow from './BaseContinueRow';

interface ResumeRowProps {
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
    limit?: number;
}
export function ResumeRow({ title, titleLine, detailLine, limit }: ResumeRowProps) {
    const { data, isLoading, error } = useResumeItems(getUserId(), limit);

    return (
        <BaseContinueRow
            title={title}
            titleLine={titleLine}
            detailLine={detailLine}
            items={data || []}
            isLoading={isLoading}
            error={error}
        />
    );
}

export default ResumeRow;
