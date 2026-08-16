import {
    getUserId,
    useResumeItems,
    type ContinueWatchingDetailLine,
    type ContinueWatchingTitleLine,
} from '@pelagica/core';
import BaseContinueRow from './BaseContinueRow';

const ResumeRow = ({
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
    const { data: resumeData, isLoading, error } = useResumeItems(getUserId(), limit);

    return (
        <BaseContinueRow
            items={resumeData || []}
            isLoading={isLoading}
            error={error}
            title={title}
            titleLine={titleLine}
            detailLine={detailLine}
        />
    );
};

export default ResumeRow;
