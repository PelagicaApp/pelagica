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
    useSeriesImage,
}: {
    limit?: number;
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
    useSeriesImage?: boolean;
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
            useSeriesImage={useSeriesImage}
        />
    );
};

export default ResumeRow;
