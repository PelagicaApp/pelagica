import type { SeerrDiscoverSlider, SeerrResolvedSlider } from './sliderResolve.ts';
import { resolveSeerrDiscoverSlider } from './sliderTypes.ts';

/**
 * Maps a Seerr Discover slider to a title row, or null to skip.
 * Unknown types are skipped so a future Seerr slider cannot crash home.
 */
export function resolveDiscoverSlider(
    slider: SeerrDiscoverSlider
): SeerrResolvedSlider | null {
    const seerr = resolveSeerrDiscoverSlider(slider);
    if (seerr.kind === 'titles') return seerr.slider;
    return null;
}
