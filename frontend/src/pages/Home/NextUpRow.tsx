import type { ContinueWatchingDetailLine, ContinueWatchingTitleLine } from '@/hooks/api/useConfig';
import { useNextUp } from '@/hooks/api/continue/useNextUp';
import { getUserId } from '@/utils/localstorageCredentials';
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
