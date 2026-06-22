import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';

interface SectionScrollerProps {
    title?: React.ReactNode;
    items: React.ReactNode[];
    icon?: React.ReactNode;
    className?: string;
    additionalButtons?: React.ReactNode;
    contentInset?: boolean;
}

export default function SectionScroller({
    title,
    items,
    className,
    additionalButtons,
    contentInset = false,
}: SectionScrollerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
    };

    const scroll = (offset: number) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        checkScroll();

        el.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        return () => {
            el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [items.length]);

    return (
        <div className={className}>
            <div
                className={
                    'flex items-center justify-between mb-3' +
                    (contentInset ? ` px-4 sm:px-12` : '')
                }
            >
                {title ? title : <div />}

                <div className="flex gap-2">
                    <Button
                        onClick={() => scroll(-300)}
                        disabled={!canScrollLeft}
                        size={'icon'}
                        variant={'outline'}
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        onClick={() => scroll(300)}
                        disabled={!canScrollRight}
                        size={'icon'}
                        variant={'outline'}
                    >
                        <ChevronRight />
                    </Button>
                    {additionalButtons}
                </div>
            </div>

            <div
                ref={scrollRef}
                className={
                    'flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide custom-scrollbar scrollbar-hide' +
                    (contentInset ? ` pl-4 sm:pl-12` : '')
                }
            >
                {items}
            </div>
        </div>
    );
}
