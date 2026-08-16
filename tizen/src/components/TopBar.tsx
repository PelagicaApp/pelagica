import { useConfig } from '@pelagica/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { House, Library, Search, Settings } from 'lucide-react';
import FocusableNavLink from './FocusableNavLink';

export type TopBarItem = 'home' | 'library' | 'search' | 'settings';

const TopBar = ({ activeItem }: { activeItem?: TopBarItem }) => {
    const { t } = useTranslation(['sidebar', 'common', 'settings']);
    const { config } = useConfig();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        handleScroll();

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const logoSrc = config?.logoDarkUrl || 'logo.svg';

    return (
        <header className="relative z-50 w-full h-17 flex items-center justify-center">
            {!scrolled && (
                <div className="pointer-events-none absolute inset-0 -bottom-5 bg-linear-to-b from-background/70 to-transparent" />
            )}

            <div
                className={cn(
                    'pointer-events-auto relative flex h-11 items-center px-2 sm:px-4 mx-3 w-full md:w-auto rounded-full transition-all duration-300 border',
                    'justify-between md:justify-start gap-1 md:gap-2',
                    scrolled
                        ? 'border-border bg-background/60 backdrop-blur shadow-sm'
                        : 'border-white/10 bg-background/20 backdrop-blur-md'
                )}
            >
                <div className="flex items-center gap-1 md:gap-2">
                    {/* Logo */}
                    {config?.showLogoInTopBar !== false && (
                        <Avatar className="h-6 w-6 p-0.5 rounded-md">
                            <AvatarImage src={logoSrc} alt="logo" />
                            <AvatarFallback className="rounded-md text-xs">PE</AvatarFallback>
                        </Avatar>
                    )}

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-0.5">
                        <FocusableNavLink to="/" active={activeItem === 'home'}>
                            <House className="h-4 w-4" />
                            {t('sidebar:home')}
                        </FocusableNavLink>

                        <FocusableNavLink to="/library" active={activeItem === 'library'}>
                            <Library className="h-4 w-4" />
                            {t('sidebar:library')}
                        </FocusableNavLink>

                        <FocusableNavLink to="/search" active={activeItem === 'search'}>
                            <Search className="h-4 w-4" />
                            {t('common:search')}
                        </FocusableNavLink>

                        <FocusableNavLink to="/settings" active={activeItem === 'settings'}>
                            <Settings className="h-4 w-4" />
                            {t('settings:title')}
                        </FocusableNavLink>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
