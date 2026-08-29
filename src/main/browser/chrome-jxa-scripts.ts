export const captureChromeTabsScript = `
function run() {
  var chrome = Application('Google Chrome');

  if (!chrome.running()) {
    return JSON.stringify({ status: 'not-running' });
  }

  var browserWindows = chrome.windows();
  var excludedIncognitoWindowCount = 0;
  var windows = [];

  for (var windowIndex = 0; windowIndex < browserWindows.length; windowIndex += 1) {
    var browserWindow = browserWindows[windowIndex];

    if (browserWindow.mode() === 'incognito') {
      excludedIncognitoWindowCount += 1;
      continue;
    }

    var browserTabs = browserWindow.tabs();
    var activeTabId = String(browserWindow.activeTab().id());
    var tabs = [];

    for (var tabIndex = 0; tabIndex < browserTabs.length; tabIndex += 1) {
      var tab = browserTabs[tabIndex];
      var tabId = String(tab.id());
      tabs.push({
        active: tabId === activeTabId,
        id: tabId,
        position: tabIndex,
        title: String(tab.title() || ''),
        url: String(tab.url() || '')
      });
    }

    windows.push({
      id: String(browserWindow.id()),
      position: windowIndex,
      tabs: tabs
    });
  }

  return JSON.stringify({
    excludedIncognitoWindowCount: excludedIncognitoWindowCount,
    status: 'ok',
    windows: windows
  });
}
`;

export const closeChromeTabsScript = `
function run(argv) {
  var targets = JSON.parse(argv[0]);
  var chrome = Application('Google Chrome');
  var browserWindows = chrome.windows();
  var closedTabCount = 0;
  var skippedTabCount = 0;

  for (var targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
    var target = targets[targetIndex];
    var matchingWindow = null;

    for (var windowIndex = 0; windowIndex < browserWindows.length; windowIndex += 1) {
      if (String(browserWindows[windowIndex].id()) === target.windowId) {
        matchingWindow = browserWindows[windowIndex];
        break;
      }
    }

    if (matchingWindow === null) {
      skippedTabCount += 1;
      continue;
    }

    var browserTabs = matchingWindow.tabs();
    var matchingTab = null;

    for (var tabIndex = 0; tabIndex < browserTabs.length; tabIndex += 1) {
      if (String(browserTabs[tabIndex].id()) === target.tabId) {
        matchingTab = browserTabs[tabIndex];
        break;
      }
    }

    if (matchingTab === null || String(matchingTab.url() || '') !== target.expectedUrl) {
      skippedTabCount += 1;
      continue;
    }

    try {
      matchingTab.close();
      closedTabCount += 1;
    } catch (_error) {
      skippedTabCount += 1;
    }
  }

  return JSON.stringify({
    closedTabCount: closedTabCount,
    skippedTabCount: skippedTabCount
  });
}
`;

export const restoreChromeWindowsScript = `
function run(argv) {
  var windows = JSON.parse(argv[0]);
  var chrome = Application('Google Chrome');
  chrome.activate();

  for (var windowIndex = 0; windowIndex < windows.length; windowIndex += 1) {
    var windowData = windows[windowIndex];

    if (windowData.urls.length === 0) {
      continue;
    }

    chrome.windows.push(chrome.Window({ mode: 'normal' }));
    var browserWindow = chrome.windows()[0];
    browserWindow.activeTab.url = windowData.urls[0];

    for (var tabIndex = 1; tabIndex < windowData.urls.length; tabIndex += 1) {
      browserWindow.tabs.push(chrome.Tab({ url: windowData.urls[tabIndex] }));
    }

    browserWindow.activeTabIndex = windowData.activePosition + 1;
  }
}
`;
