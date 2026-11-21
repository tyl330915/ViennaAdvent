# Advent Doors: Reveal on Day of Month Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each advent-calendar door become available on the corresponding day of the month, within the December 2026 season.

**Architecture:** Replace the `DEV_MODE` constant in `js/main.js` with a `computeMaxDay()` helper that derives the maximum open door from the current date, gated to the December 2026 season, with an optional `?preview=1` query-param override. Only the highlight logic changes otherwise.

**Tech Stack:** Vanilla JS single-page static site. No build step, no test framework (verification is manual in-browser as documented in the spec).

---

## File Structure

- Modify: `js/main.js` — the lock/unlock computation and today-highlight logic. No other files change.

## Reference: Target code after change

The two edits below take effect in one region of `js/main.js` (lines 2-8) plus one line (line 22). No CSS/HTML changes.

---

### Task 1: Implement season-window `computeMaxDay()`

**Files:**
- Modify: `js/main.js:2-8`

- [ ] **Step 1: Replace the `DEV_MODE` block with season-window + preview logic**

Replace the existing lines:

```js
  const DEV_MODE = true;
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const videoTypes = ['mp4', 'webm'];
  const gameDays = new Set([19]);

  const today = new Date().getDate();
  const maxDay = DEV_MODE ? 25 : Math.min(today, 25);
```

with:

```js
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const videoTypes = ['mp4', 'webm'];
  const gameDays = new Set([19]);

  const today = new Date().getDate();
  const maxDay = computeMaxDay();

  function computeMaxDay() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === '1') return 25;

    const targetYear = 2026;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (year < targetYear) return 0;
    if (year > targetYear) return 25;
    if (month !== 12) return 0;
    return Math.min(now.getDate(), 25);
  }
```

- [ ] **Step 2: Confirm the result reads correctly**

Run: `node --check js/main.js`
Expected: exits 0 with no output (syntax valid). If `node` is unavailable, skip — the edit is a pure refactor of existing statements.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "Reveal advent doors on the day of the month"
```

---

### Task 2: Only highlight today's door when unlocked

**Files:**
- Modify: `js/main.js:22`

- [ ] **Step 1: Gate the `.today` class on `unlocked`**

Replace line 22:

```js
    door.classList.toggle('today', day === today);
```

with:

```js
    door.classList.toggle('today', unlocked && day === today);
```

`unlocked` and `day` are already defined on lines 18-19 in the same `forEach`; `today` is defined at line 7.

- [ ] **Step 2: Syntax check**

Run: `node --check js/main.js`
Expected: exits 0 with no output.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "Highlight only unlocked today door"
```

---

### Task 3: Manual verification

**Files:**
- None (verification only)

- [ ] **Step 1: Confirm all doors locked before the season**

Today's date is in November 2026 (before Dec 1). Open `index.html` in a browser (double-click the file).
Expected: every door has low opacity / is not clickable and is not keyboard-focusable.

- [ ] **Step 2: Confirm `?preview=1` unlocks everything**

Open `index.html?preview=1` in a browser.
Expected: all 25 doors are enabled and clickable, and the content for any daily asset opens in the modal.

- [ ] **Step 3: Confirm mid-December reveals via a simulated date**

Temporarily edit `js/main.js` so the first line inside `computeMaxDay()` reads `const now = new Date(2026, 11, 15);` (December 15), refresh the page, then revert the edit.
Expected: doors 1-15 are enabled, door 16+ is locked, and door 15 is highlighted with the `.today` pulse. Door 16 highlighted at most when unlocked — i.e. it is not highlighted while locked.

- [ ] **Step 4: Confirm after-season overflow**

Temporarily edit the same line to `const now = new Date(2027, 1, 10);` (Feb 2027), refresh, then revert.
Expected: all doors enabled regardless of the 10th.
