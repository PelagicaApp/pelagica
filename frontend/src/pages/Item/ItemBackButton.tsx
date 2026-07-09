import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ItemBackButtonProps {
    onClick: () => void;
}

/**
 * 详情页返回按钮 — 浮于封面左上角，点击后执行智能返回导航。
 * stopPropagation + preventDefault 确保点击不会触发封面本身的播放跳转。
 */
const ItemBackButton = ({ onClick }: ItemBackButtonProps) => {
    return (
        <div className="absolute top-2 left-2 z-40">
            <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9 bg-background/40 backdrop-blur-md border border-border/40 hover:bg-background/80 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center animate-fade-in"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onClick();
                }}
            >
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default ItemBackButton;
