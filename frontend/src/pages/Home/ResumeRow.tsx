import { useResumeItems } from '@/hooks/api/continue/useResumeItems';
import type { ContinueWatchingDetailLine, ContinueWatchingTitleLine } from '@/hooks/api/useConfig';
import { getUserId } from '@/utils/localstorageCredentials';
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
