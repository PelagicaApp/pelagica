import SectionScroller from '@/components/SectionScroller';
import { Skeleton } from '@/components/ui/skeleton';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models';
import { ImageOff } from 'lucide-react';
import { useState, useCallback, memo } from 'react';
import { Link } from 'react-router';

const PeopleRow = memo(
    ({
        title,
        people,
        loading,
    }: {
        title?: React.ReactNode;
        people: BaseItemPerson[] | undefined;
        loading?: boolean;
    }) => {
        const [profilePictureErrors, setProfilePictureErrors] = useState<Record<string, boolean>>(
            {}
        );

        const handleProfilePictureError = useCallback((itemId: string) => {
            setProfilePictureErrors((prev) => ({ ...prev, [itemId]: true }));
        }, []);

        if (loading) {
            return (
                <SectionScroller
                    title={title}
                    items={Array.from({ length: 10 }, (_, i) => (
                        <div key={i} className="group min-w-30 w-30">
                            <div className="aspect-square w-full rounded-full overflow-hidden">
                                <Skeleton className="h-full w-full" />
                            </div>
                            <Skeleton className="mt-2 h-4 w-3/4 rounded-md mx-auto" />
                            <Skeleton className="mt-1 h-3 w-1/2 rounded-md mx-auto" />
                        </div>
                    ))}
                />
            );
        }

        return (
            <SectionScroller
                title={title}
                items={
                    people?.map((person) => (
                        <Link
                            to={`/person/${person.Id}`}
                            key={`${person.Id}-${person.Type}-${person.Role}`}
                            className="group min-w-30 w-30"
                        >
                            <div className="aspect-square w-full rounded-full overflow-hidden">
                                {profilePictureErrors[person.Id!] ? (
                                    <div className="bg-muted w-full h-full flex items-center justify-center rounded-full text-2xl">
                                        {person.Name ? (
                                            person.Name.split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                                .toUpperCase()
                                        ) : (
                                            <ImageOff className="w-12 h-12 text-muted-foreground" />
                                        )}
                                    </div>
                                ) : (
                                    <img
                                        src={getPrimaryImageUrl(
                                            person.Id!,
                                            {
                                                width: 120,
                                            },
                                            person.PrimaryImageTag || undefined
                                        )}
                                        alt={person.Name || 'No Name'}
                                        className="h-full w-full object-cover group-hover:opacity-75 group-hover:scale-105 transition-opacity transition-transform duration-300 ease-out will-change-transform"
                                        onError={() => handleProfilePictureError(person.Id!)}
                                    />
                                )}
                            </div>
                            <p className="mt-2 text-md line-clamp-1 text-ellipsis break-all text-center">
                                {person.Name || 'No Name'}
                            </p>
                            {person.Role && (
                                <p className="mt-1 text-sm line-clamp-2 text-ellipsis text-muted-foreground text-center">
                                    {person.Role}
                                </p>
                            )}
                        </Link>
                    )) || []
                }
            />
        );
    }
);

PeopleRow.displayName = 'PeopleRow';

export default PeopleRow;
