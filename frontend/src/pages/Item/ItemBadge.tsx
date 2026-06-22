import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

interface ItemBadgeProps {
    className?: string;
    asChild?: boolean;
    children: React.ReactNode;
}

const ItemBadge = ({ className, asChild, children }: ItemBadgeProps) => (
    <Badge
        variant="secondary"
        className={cn(
            'bg-black/5 border-black/5',
            'dark:bg-white/5 dark:border-white/5',
            'text-foreground hover:underline transition-colors px-2.5 py-0.5',
            className
        )}
        asChild={asChild}
    >
        {children}
    </Badge>
);

export default ItemBadge;
