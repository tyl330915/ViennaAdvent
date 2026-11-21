# Advent Calendar: Reveal Dates on the Day of the Month

Date: 2026-11-21
Status: Approved

## Problem

The Vienna Advent Calendar currently unlocks **all 25 doors** regardless of the
current date, because `DEV_MODE` in `js/main.js` is set to `true`:

```js
const DEV_MODE = true;
const today = new Date().getDate();
const maxDay = DEV_MODE ? 25 : Math.min(today, 25);
```

The owner wants doors revealed on the day of the month: door N becomes
available on calendar day N, within the December season.

## Behavior

- **Before Dec 1 of the target year (2026):** all doors locked (`maxDay = 0`).
- **During Dec 2026:** door N unlocks on day N, capped at 25
  (`maxDay = min(today, 25)`).
- **After Dec 2026:** all doors stay open permanently (`maxDay = 25`).

### Dev override

An optional `?preview=1` URL query parameter forces all doors open, giving the
owner a way to inspect every day's content before/after the season.

## Approach

Replace the `DEV_MODE` flag with a small season-window computation in
`js/main.js`. The target year ("Vienna Advent Calendar 2026") is hardcoded so
"before the season" and "after the season" are distinguishable.

Pseudo-logic:

```js
const targetYear = 2026;

function computeMaxDay() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') === '1') return 25;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const today = now.getDate();

  if (year < targetYear) return 0;
  if (year > targetYear) return 25;
  if (month !== 12) return 0;               // still Nov of target year (or earlier)
  return Math.min(today, 25);               // December of target year
}
```

Remaining uses of `today` (the highlight of the current day's door) continue to
work off `new Date().getDate()` as today.

## Details / Edges

- The `.today` highlighting is only meaningful while the matching door is
  unlocked. The change should only add the `today` class to an unlocked door
  whose `data-day` matches the current day of month.
- `DEV_MODE` is removed entirely (replaced by `?preview=1`).
- No CSS changes needed; existing `.enabled`, `.today`, and `.door` styles are
  reused.

## Testing

No test framework exists; the site is static. Verification is manual:

1. Open the deployed page; with today's date in the past season, confirm all
   doors are locked.
2. Open with `?preview=1`; confirm all 25 doors are enabled and openable.
3. Temporarily use a December-fixed comparison (via a `new Date('2026-12-15')`
   stand-in during review, not committed) to confirm mid-December unlocks up to
   the 15th.
4. Confirm the current-day door is highlighted only when unlocked.
