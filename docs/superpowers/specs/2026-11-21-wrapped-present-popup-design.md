# Advents Calendar: "Present is still being wrapped" Popup

Date: 2026-11-21
Status: Approved

## Problem

Today, locked advent doors (those whose date has not yet arrived) are not
clickable at all (`pointer-events: none`, `tabindex="-1"`, `aria-disabled`).
The owner wants clicking a locked door to show a friendly modal message:
"Your present is still being wrapped... please be patient!"

## Behavior

- **Locked door clicked** (mouse click, or Enter/Space via keyboard): open the
  existing modal and show the exact text
  `Your present is still being wrapped... please be patient!`
  (rendered with the codebase's unicode-ellipsis convention `\u2026`).
- **Unlocked door clicked**: unchanged — opens that day's content.
- Locked doors become *fully interactive*: focusable (`tabindex="0"`), no
  `aria-disabled`, and screen-reader label `Day N — not yet available`.
  Unlocked doors keep `Open day N`.
- Modal dismiss (close button, backdrop click, Escape) works as it does today.

## Approach

Reuse the existing modal (`#modal` / `#modal-content`), the `showMessage()`
renderer, and the `closeModal()` logic. No HTML changes.

### CSS (`css/style.css`)

Base `.door` rule currently sets `pointer-events: none` (keeps locked doors
non-interactive); `.door.enabled` sets `pointer-events: auto`. Change the base
rule to `pointer-events: auto` so all doors are clickable, while keeping the
dimmed `opacity: 0.35` for locked doors. This mirrors the proven pattern where
`.door.enabled` already re-enables events inside the `pointer-events: none`
overlay SVG.

### JS (`js/main.js`)

1. In the `doors.forEach` click handler, replace the early return:
   - if door `.enabled` → `openDay(day)`
   - else → `showWrappedMessage()`

2. Add `showWrappedMessage()` that mirrors `openDay`'s modal flow:
   - `requestId += 1` (cancels any in-flight open)
   - `modal.classList.remove('hidden')`, `modal.setAttribute('aria-hidden', 'false')`
   - render the message via `showMessage()` using
     `'Your present is still being wrapped' + '\u2026' + ' please be patient!'`

3. In the same `forEach`, stop setting `aria-disabled` and `tabindex="-1"` for
   locked doors. Instead:
   - set `tabindex` to `"0"` for every door
   - remove `aria-disabled` entirely
   - locked doors get `aria-label` `'Day ' + day + ' \u2014 not yet available'`
   - unlocked doors keep `'Open day ' + day`

The existing keydown handler already calls `door.click()` for Enter/Space, so
keyboard activation of locked doors works without extra code. The existing
`.door:focus-visible` CSS already applies a focus ring to every door.

## Correctness / Edge Cases

- Clicking a locked door must not start a content-load race: bumping
  `requestId` at the top of `showWrappedMessage` handles that.
- The `enabled` class is the single source of truth for locked/unlocked (set at
  load time from `day <= maxDay`); it does not change during a session.
- Message text uses `\u2026` to match existing strings (e.g.
  `'Opening day ' + day + '\u2026'`).
- `pointer-events: auto` on base `.door` only affects the door groups, matching
  current unlocked-door behavior; the snow/video overlays remain untouched.

## Testing

No test framework exists; the site is static. Manual verification in browser:

1. Load the page with today's real date (pre-season → all doors locked).
2. Click a locked door → modal appears with the exact wrapping message.
3. Press Escape / click backdrop / close button → modal dismisses.
4. Tab to a locked door, press Enter and Space → same popup.
5. Open `index.html?preview=1`, verify unlocked doors still open their content
   as before.
6. Confirm locked doors remain visually dimmed but cursor still shows pointer.
