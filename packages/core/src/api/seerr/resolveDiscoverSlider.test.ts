import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveDiscoverSlider } from './resolveDiscoverSlider.ts';
import type { SeerrDiscoverSlider } from './sliderResolve.ts';
import { resolveSeerrDiscoverSlider, SeerrDiscoverSliderType } from './sliderTypes.ts';

function slider(
    type: number,
    extra: Partial<SeerrDiscoverSlider> = {}
): SeerrDiscoverSlider {
    return {
        id: 1,
        type,
        order: 0,
        isBuiltIn: true,
        enabled: true,
        ...extra,
    };
}

test('seerr title sliders resolve', () => {
    const resolved = resolveDiscoverSlider(slider(SeerrDiscoverSliderType.TRENDING));
    assert.equal(resolved?.path, 'discover/trending');
    assert.equal(resolved?.type, SeerrDiscoverSliderType.TRENDING);
});

test('seerr genre grids are skipped, not unknown', () => {
    assert.equal(resolveSeerrDiscoverSlider(slider(SeerrDiscoverSliderType.MOVIE_GENRES)).kind, 'skip');
    assert.equal(resolveDiscoverSlider(slider(SeerrDiscoverSliderType.MOVIE_GENRES)), null);
});

test('unknown future seerr type is skipped instead of throwing', () => {
    assert.equal(resolveSeerrDiscoverSlider(slider(99)).kind, 'unknown');
    assert.equal(resolveDiscoverSlider(slider(99)), null);
});

test('disabled sliders are skipped', () => {
    assert.equal(
        resolveDiscoverSlider(slider(SeerrDiscoverSliderType.TRENDING, { enabled: false })),
        null
    );
});

test('custom movie keyword slider keeps title', () => {
    const resolved = resolveDiscoverSlider(
        slider(SeerrDiscoverSliderType.TMDB_MOVIE_KEYWORD, {
            id: 42,
            title: 'Anime',
            data: '123',
        })
    );
    assert.equal(resolved?.id, 42);
    assert.equal(resolved?.path, 'discover/movies');
    assert.equal(resolved?.query?.keywords, '123');
    assert.equal(resolved?.title, 'Anime');
});

test('trakt and anilist title sliders resolve', () => {
    const trakt = resolveDiscoverSlider(slider(SeerrDiscoverSliderType.TRAKT_RECOMMENDATIONS));
    assert.equal(trakt?.path, 'discover/trakt/recommendations');

    const list = resolveDiscoverSlider(
        slider(SeerrDiscoverSliderType.TRAKT_LIST, {
            title: 'My List',
            data: 'https://trakt.tv/users/x/lists/y',
        })
    );
    assert.equal(list?.path, 'discover/trakt/list');
    assert.equal(list?.query?.url, 'https://trakt.tv/users/x/lists/y');
    assert.equal(list?.title, 'My List');

    const anilist = resolveDiscoverSlider(slider(SeerrDiscoverSliderType.ANILIST_TRENDING));
    assert.equal(anilist?.path, 'discover/anilist/trending');
});

test('retired simkl types are skipped', () => {
    assert.equal(resolveDiscoverSlider(slider(SeerrDiscoverSliderType.SIMKL_BEST_TV)), null);
});
