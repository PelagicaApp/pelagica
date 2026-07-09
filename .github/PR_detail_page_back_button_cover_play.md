# Detail Page: Back Button, Cover Play Button & Cover Size Optimization

## Summary

This PR introduces three UX improvements to the item detail pages (Movie, Episode, Series, Season, BoxSet):

1. **Back button** — A floating back button on the cover that intelligently navigates the user back
2. **Cover play button** — Movie & episode covers are now clickable to start playback directly, with a hover play overlay
3. **Cover size optimization** — Cover aspect ratio is dynamically calculated from the image's natural dimensions instead of a fixed 2:3 ratio

---

## Changes

### 1. Back Button (`ItemBackButton`)

- **New component**: `frontend/src/pages/Item/ItemBackButton.tsx`
- A small floating button (top-left of the cover) with backdrop blur and fade-in animation
- **Smart navigation logic** in `ItemPage.tsx`:
  - First attempts `navigate(-1)` (browser history back) if history exists
  - Falls back to type-aware parent navigation:
    - `Episode` → Season → Series → Home
    - `Season` → Series → Parent → Home
    - `Movie` / `Series` / `BoxSet` → Parent library → Library page
- `stopPropagation` + `preventDefault` ensures the button click doesn't trigger the cover's play link

### 2. Cover Play Button (Movie & Episode only)

- The poster/thumbnail is wrapped in a `<Link to="/play/{itemId}">` making the entire cover clickable
- On hover (desktop), a semi-transparent circular play button fades in at the center
- On mobile, the play overlay is always visible (`opacity-100`)
- Applied to `MoviePage.tsx` and `EpisodePage.tsx`

### 3. Cover Size Optimization (all detail pages)

- Replaced the fixed `aspect-2/3` ratio with a dynamic `aspectRatio` style
- Reads the image's `naturalWidth` / `naturalHeight` on load and calculates the real ratio
- Falls back to `item.PrimaryImageAspectRatio`, then `2/3` as a sensible default
- Added `prevItemId` tracking to reset the ratio when navigating between items
- Enlarged responsive width classes (`sm:max-w-[24rem]` → `xl:max-w-[36rem]`) to better utilize large screens
- Applied to `MoviePage`, `EpisodePage`, `SeriesPage`, `SeasonPage`, `BoxSetPage`

---

## Files Changed

| File | Change |
|------|--------|
| `ItemBackButton.tsx` | **New** — Back button component |
| `ItemPage.tsx` | `handleBack` logic + `onBack` prop passed to child pages |
| `MoviePage.tsx` | Back button + cover play button + cover size optimization |
| `EpisodePage.tsx` | Back button + cover play button |
| `SeriesPage.tsx` | Back button + cover size optimization |
| `SeasonPage.tsx` | Back button + cover size optimization |
| `BoxSetPage.tsx` | Back button + cover size optimization |

**7 files changed, +310 / -127 lines**

---

## Screenshots

<!-- TODO: Add before/after screenshots here -->

---

## Testing

- [ ] Enter a Movie detail page → cover left-top shows back button, clicking it returns to library
- [ ] Enter an Episode detail page → cover is clickable, hover shows play button
- [ ] Enter a Series/Season/BoxSet detail page → back button works, cover ratio adapts to non-standard posters
- [ ] Navigate between items → aspect ratio resets correctly (no stale ratio from previous item)
- [ ] Mobile: play overlay is always visible on cover
- [ ] Back button click does not trigger cover play navigation
