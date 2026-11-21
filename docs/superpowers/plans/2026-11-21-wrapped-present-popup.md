# Wrapped-Present Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user clicks a locked advent door, show the existing modal with "Your present is still being wrapped… please be patient!" instead of doing nothing.

**Architecture:** All doors become clickable (`pointer-events: auto` in CSS). The JS door click handler branches on the existing `enabled` class: unlocked → `openDay(day)` (unchanged), locked → new `showWrappedMessage()`, which reuses the existing `#modal` and `showMessage()` renderer. Locked doors become fully interactive (tabindex 0, no aria-disabled, descriptive label).

**Tech Stack:** Vanilla JS + CSS static site. No build step, no test framework (manual browser verification per spec).

---

## File Structure

- Modify: `css/style.css` — base `.door` rule gains `pointer-events: auto`.
- Modify: `js/main.js` — click handler branch, `showWrappedMessage()`, and door a11y attributes.
- No HTML changes.

## Reference context

At `js/main.js:31-58`, the `doors.forEach` block configures each door. `openDay(day)` at `js/main.js:117` sets `requestId += 1`, removes `hidden`, sets `aria-hidden="false"`, then calls `showMessage(...)`. `showMessage(message)` is at `js/main.js:241` and renders a `.modal-message` div via `modalContent.replaceChildren(box)`. `closeModal()` at `js/main.js:268` bumps `requestId`, hides the modal, and clears `modalContent`.

---

### Task 1: Make all doors clickable

**Files:**
- Modify: `css/style.css:46-53`

- [ ] **Step 1: Change the base `.door` rule**

In `css/style.css`, the base `.door` rule currently reads:

```css
.door {
  cursor: pointer;
  opacity: 0.35;
  pointer-events: none;
  user-select: none;
  transition: opacity 0.25s ease;
}
.door.enabled { opacity: 1; pointer-events: auto; }
```

Replace the base rule's `pointer-events: none;` with `pointer-events: auto;` so it becomes:

```css
.door {
  cursor: pointer;
  opacity: 0.35;
  pointer-events: auto;
  user-select: none;
  transition: opacity 0.25s ease;
}
.door.enabled { opacity: 1; pointer-events: auto; }
```

(Keep the `.door.enabled` line as-is; `pointer-events: auto` on `.door.enabled` is now redundant but harmless. Keep the dimmed `opacity: 0.35` for locked doors.)

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "Make all advent doors clickable"
```

---

### Task 2: Show wrapped-present popup for locked doors

**Files:**
- Modify: `js/main.js:46-50` (click handler)
- Modify: `js/main.js` (add `showWrappedMessage`; place it immediately before `openDay` at line 117)

- [ ] **Step 1: Branch the click handler**

At `js/main.js:46-50`, replace:

```js
    door.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!door.classList.contains('enabled')) return;
      openDay(day);
    });
```

with:

```js
    door.addEventListener('click', (event) => {
      event.stopPropagation();
      if (door.classList.contains('enabled')) {
        openDay(day);
      } else {
        showWrappedMessage();
      }
    });
```

- [ ] **Step 2: Add `showWrappedMessage()`**

Insert this function immediately above `function openDay(day) {` (currently at line 117):

```js
  function showWrappedMessage() {
    requestId += 1;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    showMessage('Your present is still being wrapped' + '\u2026' + ' please be patient!');
  }
```

The `requestId += 1` cancels any in-flight content load, matching `openDay`'s flow.

- [ ] **Step 3: Syntax check**

Run: `node --check js/main.js`
Expected: exits 0 with no output. Skip if node is unavailable.

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "Show wrapping message when a locked door is clicked"
```

---

### Task 3: Make locked doors focusable and well-labeled

**Files:**
- Modify: `js/main.js:37-44` (a11y attributes in the `doors.forEach` block)

- [ ] **Step 1: Replace the a11y attribute block**

At `js/main.js:37-44`, replace:

```js
    door.setAttribute('aria-disabled', String(!unlocked));
    door.setAttribute('tabindex', unlocked ? '0' : '-1');

    if (unlocked) {
      door.setAttribute('aria-label', 'Open day ' + day);
    } else {
      door.removeAttribute('aria-label');
    }
```

with:

```js
    door.setAttribute('tabindex', '0');

    if (unlocked) {
      door.setAttribute('aria-label', 'Open day ' + day);
    } else {
      door.setAttribute('aria-label', 'Day ' + day + ' \u2014 not yet available');
    }
```

Notes:
- `aria-disabled` is removed entirely (locked doors now do something).
- All doors get `tabindex="0"` so keyboard users can reach locked doors too.
- The existing keydown handler (calls `door.click()` on Enter/Space) already routes keyboard activation to the new branch — no change needed there.
- The existing `.door:focus-visible` CSS already provides a focus ring on every door.

- [ ] **Step 2: Syntax check**

Run: `node --check js/main.js`
Expected: exits 0 with no output.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "Make locked doors focusable with descriptive labels"
```

---

### Task 4: Manual verification

**Files:**
- None (verification only)

- [ ] **Step 1: Pre-season locked behavior**

Today's date (Nov 2026) means all doors are locked. Open `index.html` in a browser.
Expected: doors appear dimmed (opacity 0.35), but hovering shows a pointer cursor.

- [ ] **Step 2: Click a locked door**

Click any door.
Expected: modal opens with centered text "Your present is still being wrapped… please be patient!".

- [ ] **Step 3: Dismiss the modal**

Click the close button, then reopen and click the dark backdrop, then reopen and press Escape.
Expected: modal dismisses each time; underlying page unchanged.

- [ ] **Step 4: Keyboard access**

Press Tab until a locked door is focused (focus ring visible), press Enter, close, then repeat with Space bar.
Expected: same "wrapped" popup appears each time.

- [ ] **Step 5: Unlocked doors still work**

Open `index.html?preview=1` (unlocks everything), click a door.
Expected: day content (video/image/game) opens as before; the wrapping message does NOT appear.

- [ ] **Step 6: Confirm no content-load race**

From the preview view, click a door (content loads), then immediately close and click a locked door.
Expected: the wrapping message shows, and no stale day content overwrites it.
