/**
 * Mini Tab Counter – popup logic (Manifest V3).
 *
 * Privacy: this script only ever uses the *length* of the arrays returned by
 * the Chrome APIs. It never reads tab URLs, titles, or any other tab
 * property, and it stores/transmits nothing.
 *
 * No "tabs" permission is needed: chrome.tabs.query() and the tab/window
 * events work without it. That permission only adds url/title/favIconUrl to
 * results, which this extension deliberately does not want.
 */

'use strict';

const els = {
  totalTabs: document.getElementById('total-tabs'),
  windowTabs: document.getElementById('window-tabs'),
  windowCount: document.getElementById('window-count'),
  error: document.getElementById('error'),
};

// Only count regular browser windows (not DevTools, app or popup windows).
const NORMAL_WINDOWS = { windowType: 'normal' };

/**
 * Fetch the three counts from Chrome.
 * The queries run in parallel; Promise.all rejects if any fails.
 *
 * @returns {Promise<{totalTabs: number, windowTabs: number, windowCount: number}>}
 */
async function fetchCounts() {
  const [allTabs, currentWindowTabs, windows] = await Promise.all([
    chrome.tabs.query(NORMAL_WINDOWS),
    // "currentWindow" from a popup = the browser window the popup belongs to,
    // i.e. the window the user is looking at.
    chrome.tabs.query({ ...NORMAL_WINDOWS, currentWindow: true }),
    chrome.windows.getAll({ populate: false, windowTypes: ['normal'] }),
  ]);

  return {
    totalTabs: allTabs.length,
    windowTabs: currentWindowTabs.length,
    windowCount: windows.length,
  };
}

/**
 * Write the counts into the popup, or show a friendly error.
 *
 * @param {{totalTabs: number, windowTabs: number, windowCount: number}} counts
 */
function render(counts) {
  els.totalTabs.textContent = String(counts.totalTabs);
  els.windowTabs.textContent = String(counts.windowTabs);
  els.windowCount.textContent = String(counts.windowCount);
  els.error.hidden = true;
}

function showError(err) {
  console.error('Mini Tab Counter: failed to read counts', err);
  els.error.textContent = 'Could not read tab counts. Try reopening the popup.';
  els.error.hidden = false;
}

/** Fetch + render, with error handling. Safe to call repeatedly. */
async function refresh() {
  try {
    render(await fetchCounts());
  } catch (err) {
    showError(err);
  }
}

/**
 * Coalesce bursts of events (e.g. closing a window fires one removal event
 * per tab) into a single refresh.
 */
let refreshTimer = null;
function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refresh, 50);
}

/**
 * Subscribe to tab/window events so counts stay live while the popup is open.
 * Listeners live only as long as the popup does, so no background service
 * worker is needed.
 */
function registerLiveUpdates() {
  const events = [
    chrome.tabs.onCreated,
    chrome.tabs.onRemoved,
    chrome.tabs.onAttached, // tab moved into another window
    chrome.tabs.onDetached, // tab moved out of a window
    chrome.windows.onCreated,
    chrome.windows.onRemoved,
    chrome.windows.onFocusChanged,
  ];
  for (const event of events) {
    event.addListener(scheduleRefresh);
  }
}

// Refresh immediately every time the popup opens, then keep updating.
refresh();
registerLiveUpdates();
