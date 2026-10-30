# Mini Tab Counter

A lightweight Chrome extension (Manifest V3) that shows:

- **Total tabs** across all Chrome windows
- **Tabs in the current window**
- **Number of open windows**

Counts refresh when the popup opens and update live while it stays open.

## Project structure

```
chrome-tab-counter/
├── manifest.json   # MV3 manifest (no permissions requested)
├── popup.html      # Popup markup
├── popup.css       # Popup styles (light + dark)
├── popup.js        # Counting + live-update logic
├── icons/          # 16, 48 and 128 px PNG icons (128 px doubles as the store icon)
└── README.md
```

## Load it locally

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the `chrome-tab-counter` folder (the one containing `manifest.json`).
5. Click the puzzle-piece icon in the toolbar and pin **Mini Tab Counter**.
6. Click its icon to open the popup.

After editing code, click the reload icon on the extension's card in `chrome://extensions`.

## Permissions

**None.** The manifest has no `permissions` or `host_permissions` entries.

- `chrome.tabs.query()` and the tab/window events work without the `tabs` permission.
- The `tabs` permission would only add access to tab `url`, `title` and `favIconUrl`, which this extension intentionally never needs, so it is not requested.
- Chrome therefore shows no permission warning on install.

## Privacy

- Uses only the *number* of tabs/windows returned by Chrome.
- Never reads URLs or page titles.
- No storage, no network requests, no background script, no external libraries.

## How it works

- `popup.js` runs `chrome.tabs.query` (all tabs, and current window) and `chrome.windows.getAll` in parallel, then writes the lengths into the popup.
- Only `normal` browser windows are counted (DevTools, app and popup windows are ignored).
- While the popup is open it listens for `tabs.onCreated/onRemoved/onAttached/onDetached` and `windows.onCreated/onRemoved/onFocusChanged`. Bursts of events are debounced (50 ms) into one refresh.
- Tab reordering inside a window doesn't change any count, so `onMoved` isn't needed. Moving a tab *between* windows fires `onDetached`/`onAttached`, which are handled.
- Errors are caught and shown as a short message in the popup.

## Test cases

| # | Scenario | Setup | Expected |
|---|----------|-------|----------|
| 1 | Zero or one tab | One window with a single tab (Chrome can't run with zero tabs, so 1 is the minimum) | Total 1, This window 1, Windows 1 |
| 2 | Multiple tabs, one window | Open 5 tabs in one window | Total 5, This window 5, Windows 1 |
| 3 | Multiple windows | Window A with 3 tabs, window B with 2 tabs; open popup in A | Total 5, This window 3, Windows 2. Reopen in B: This window 2 |
| 4 | Open/close tabs | With popup open, open a tab from the keyboard, then close one | Counts change within a moment, without reopening |
| 5 | Move tab between windows | Drag a tab from A (3) to B (2) with popup open | Total stays 5; A shows 2, B shows 3 |
| 6 | Close a window | Close window B (2 tabs) | Total drops by 2, Windows drops by 1 |

Note: the popup closes when you click elsewhere, so for live-update tests (4–6) open the popup in a separate small window via `chrome-extension://<extension-id>/popup.html` in a tab (the ID is shown on `chrome://extensions`). Counts will include that tab itself.

## Manual testing checklist

- [ ] Extension loads with no errors on `chrome://extensions`
- [ ] No permission warnings shown
- [ ] Popup shows correct numbers on open (1 window, 1 tab)
- [ ] Open several tabs, reopen popup: totals correct
- [ ] Open a second window: Windows = 2, Total = sum of both
- [ ] "This window" matches whichever window the popup was opened from
- [ ] Live update on tab create / close
- [ ] Live update when dragging a tab to another window
- [ ] Live update when closing a window with many tabs (single, correct final count)
- [ ] Incognito windows: not counted unless you enable "Allow in Incognito" for the extension
- [ ] DevTools window open: not counted as a window
- [ ] Dark mode: popup is readable
- [ ] No console errors (right-click popup > Inspect)
- [ ] DevTools Network tab shows no requests from the popup
