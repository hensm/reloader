"use strict";

const _ = browser.i18n.getMessage;


let isThemeDark = false;

function checkCurrentTheme (theme) {
    isThemeDark = theme.name === "Dark"
        || (theme.name === "Default"
            && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

// Detect theme for icon contrast
browser.management.getAll().then(extensions => {
    const currentTheme = extensions.filter(
            ext => ext.type === "theme" && ext.enabled)[0];

    checkCurrentTheme(currentTheme);
    updateAllPageActionIcons();
});

// Listen for theme changes to maintain icon contrast
browser.management.onEnabled.addListener(info => {
    if (info.type === "theme") {
        checkCurrentTheme(info);
        updateAllPageActionIcons();
    }
});


let pageActionTitleIdle;
let pageActionTitleBusy = _("page_action_busy_title", "Esc");

// Detect OS to set macOS shortcuts
browser.runtime.getPlatformInfo().then(info => {
    pageActionTitleIdle = _("page_action_idle_title"
          , `${info.os === "mac" ? "⌘" : "Ctrl"}+R`);
});


const animationTimeouts = new Map();

/**
 * Updates the reload button icon for the page action attached to the
 * tab specified.
 *
 * @param tab        Tab with the page action to update
 * @param isAnimated Set icon and start an animation
 */
function updatePageActionIcon (tab, isAnimated = true) {
    let path;

    if (animationTimeouts.has(tab.id)) {
        window.clearTimeout(animationTimeouts.get(tab.id));
    }

    if (isAnimated) {
        const reloadIconPath = isThemeDark
            ? "data/reload_to_stop_dark.svg"
            : "data/reload_to_stop_light.svg";
        const stopIconPath = isThemeDark
            ? "data/stop_to_reload_dark.svg"
            : "data/stop_to_reload_light.svg";

        // Bypass caching
        const queryString = `?t=${Math.random().toString(36).slice(2, 8)}`;

        path = (tab.status === "loading"
            ? stopIconPath
            : reloadIconPath) + queryString;

        // Set the still frame icon after the animation finishes
        const timeoutId = window.setTimeout(() => {
            updatePageActionIcon(tab, false);
            animationTimeouts.delete(tab.id);
        }, 417);

        animationTimeouts.set(tab.id, timeoutId);
    } else {
        const reloadIconPath = isThemeDark
            ? "data/reload_dark.svg"
            : "data/reload_light.svg";
        const stopIconPath = isThemeDark
            ? "data/stop_dark.svg"
            : "data/stop_light.svg";

        path = tab.status === "loading"
            ? stopIconPath
            : reloadIconPath;
    }

    const actionIcon = {
        tabId: tab.id
      , path
    };

    console.log("updatePageActionIcon", path, isAnimated);

    browser.pageAction.setIcon(actionIcon);
    browser.browserAction.setIcon(actionIcon);
}

/**
 * Updates reload button icons on all tabs
 */
function updateAllPageActionIcons () {
    browser.tabs.query({}).then(tabs => {
        for (const tab of tabs) {
            updatePageActionIcon(tab);
        }
    });
}

/**
 * Shows the reload button on a tab. Called initially on startup and
 * once a tab has been created.
 *
 * @param tab Tab with the page action to show
 */
function updatePageAction (tab) {
    browser.pageAction.show(tab.id);

    const actionTitle = {
        tabId: tab.id
      , title: tab.status === "loading"
            ? pageActionTitleBusy
            : pageActionTitleIdle
    };

    browser.pageAction.setTitle(actionTitle);
    browser.browserAction.setTitle(actionTitle);
}


function onActionClicked (tab) {
    if (tab.status === "loading") {
        /**
         * Extension API has no stop method, best alternative is to inject a
         * script into the page and use the window.stop API.
         *
         * Injecting scripts into privileged pages isnt possible. Usually
         * doesn't matter since it's almost instant, but stopping loading from
         * about: pages or error pages will fail.
         */
        browser.tabs.executeScript({
            code: "window.stop()"
          , runAt: "document_start"
        }).catch(err => {
            console.error(`${_("extension_name")}: https://git.io/vbCz7`);
        });
    } else {
        browser.tabs.reload()
    }
}

browser.pageAction.onClicked.addListener(onActionClicked);
browser.browserAction.onClicked.addListener(onActionClicked);


// Show page action on all tabs
browser.tabs.query({}).then(tabs => {
    for (const tab of tabs) {
        updatePageAction(tab);
        updatePageActionIcon(tab);
    }
});

// Show page action on new tabs
browser.tabs.onCreated.addListener(tab => {
    updatePageAction(tab);
    updatePageActionIcon(tab);
});

browser.tabs.onUpdated.addListener((tabId, info, tab) => {
    updatePageAction(tab);
    updatePageActionIcon(tab, false);
}, { properties: [ "status" ] });


/**
 * Store timestamps for each navigation event to reference in
 * future.
 */
const navigationTimestamp = new Map();

function onNavigation (details) {
    // Only act on top-level navigation
    if (details.frameId) return;

    browser.tabs.get(details.tabId)
        .then(tab => {
            let shouldAnimate = true;

            if (navigationTimestamp.has(details.tabId)) {
                // Time since last navigation
                const diff = details.timeStamp
                        - navigationTimestamp.get(details.tabId);

                /**
                 * If time passed is less than duration of the animation, just
                 * set still frames.
                 */
                if (diff < 417) {
                    shouldAnimate = false;
                }
            }

            updatePageAction(tab);
            updatePageActionIcon(tab, shouldAnimate);

            // Record new timestamp
            navigationTimestamp.set(details.tabId, details.timeStamp);
        });
}

// Show/update icon on navigation
browser.webNavigation.onBeforeNavigate.addListener(onNavigation);
browser.webNavigation.onCompleted.addListener(onNavigation);

// Update icon on stop
browser.webNavigation.onErrorOccurred.addListener(onNavigation);



/**
 * bypassCache on reload only applies to content loaded with
 * the page. For anything loaded after, the cache must be
 * cleared properly.
 */
function emptyCacheAndHardReload () {
    // Clear cache
    browser.browsingData.remove({}, { cache: true })
        .then(() => {
            // Reload once cache is cleared
            browser.tabs.reload({
                bypassCache: true
            });
        });
}


browser.commands.onCommand.addListener(command => {
    switch (command) {
        case menuIdEmptyCacheAndHardReload:
            emptyCacheAndHardReload();
            break;
    }
});


const menuIdNormalReload = browser.menus.create({
    title: _("page_action_context_normal_reload_title")
  , command: "_execute_page_action"
  , contexts: [ "page_action" , "browser_action" ]
});
const menuIdHardReload = browser.menus.create({
    title: _("page_action_context_hard_reload_title")
  , contexts: [ "page_action" , "browser_action" ]
});
const menuIdEmptyCacheAndHardReload = browser.menus.create({
    title: _("page_action_context_empty_cache_and_hard_reload_title")
  , contexts: [ "page_action", "browser_action" ]
})

browser.menus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        // Reload without cached content
        case menuIdHardReload: {
            browser.tabs.reload({
                bypassCache: true
            });
            break;
        }
        case menuIdEmptyCacheAndHardReload: {
            emptyCacheAndHardReload();
            break;
        }
    }
});
