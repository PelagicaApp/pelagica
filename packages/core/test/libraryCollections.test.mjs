import assert from 'node:assert/strict';
import test from 'node:test';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type.js';
import { CollectionTypeOptions } from '@jellyfin/sdk/lib/generated-client/models/collection-type-options.js';
import { isSupportedLibrary } from '../src/utils/collectionItemTypes.ts';

const library = { Id: 'library-id', Type: 'CollectionFolder' };

test('library discovery accepts both SDK collection-type contracts', () => {
    const types = new Set([
        ...Object.values(CollectionType),
        ...Object.values(CollectionTypeOptions),
    ]);
    const visible = [...types].filter((CollectionType) =>
        isSupportedLibrary({ ...library, CollectionType })
    );
    assert.deepEqual(new Set(visible), types);
});

test('untyped library containers remain visible without accepting untyped media', () => {
    assert.equal(isSupportedLibrary(library), true);
    assert.equal(isSupportedLibrary({ ...library, CollectionType: null }), true);
    assert.equal(isSupportedLibrary({ Id: 'view-id', Type: 'UserView' }), true);
    assert.equal(isSupportedLibrary({ Id: 'movie-id', Type: 'Movie' }), false);
    assert.equal(isSupportedLibrary({ Type: 'CollectionFolder' }), false);
});

test('an unsupported explicit collection type is not silently reclassified as mixed', () => {
    assert.equal(isSupportedLibrary({ ...library, CollectionType: 'unrecognized-type' }), false);
});
