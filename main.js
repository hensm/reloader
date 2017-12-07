"use strict";

const _ = browser.i18n.getMessage;


// Data path accounting for language direction
const data_path = `data/${_("@@bidi_dir")}`;


let is_theme_dark = false;

// Array of theme ids using light icons
const dark_theme_ids = [
    "firefox-compact-dark@mozilla.org@personas.mozilla.org"
];

// Detect theme for icon contrast
browser.management.getAll().then(extensions => {
    const current_theme = extensions.filter(ext =>
            ext.type === "theme"
         && ext.enabled)[0];

    is_theme_dark = dark_theme_ids.includes(current_theme.id);
    update_all_page_action_icons();
});

// Listen for theme changes to maintain icon contrast
browser.management.onEnabled.addListener(info => {
    if (info.type === "theme") {
        is_theme_dark = dark_theme_ids.includes(info.id);
        update_all_page_action_icons();
    }
});


// Titles use Windows/Linux shortcuts until platform is fetched
let page_action_title_idle = _("page_action_busy_title", "Ctrl");
let page_action_title_busy = _("page_action_busy_title", "Esc");

// Detect OS to set macOS shortcuts
browser.runtime.getPlatformInfo().then(info => {
    page_action_title_idle = _("page_action_idle_title"
          , `${info.os === "mac" ? "⌘" : "Ctrl"}+R`);
});


/**
 * Updates the reload button icon for the page action attached to the
 * tab specified.
 *
 * @param tab Tab with the page action to update
 */
function update_page_action_icon (tab) {
    const reload_icon_path = is_theme_dark
        ? `${data_path}/reload_dark.svg`
        : `${data_path}/reload_light.svg`;
    const stop_icon_path = is_theme_dark
        ? `${data_path}/stop_dark.svg`
        : `${data_path}/stop_light.svg`;

    const action_icon = {
        tabId: tab.id
      , path: tab.status === "loading"
            ? stop_icon_path
            : reload_icon_path
    };

    browser.pageAction.setIcon(action_icon);
    browser.browserAction.setIcon(action_icon);
}

/**
 * Updates reload button icons on all tabs
 */
function update_all_page_action_icons () {
    browser.tabs.query({}).then(tabs => {
        for (const tab of tabs) {
            update_page_action_icon(tab);
        }
    });
}

/**
 * Shows the reload button on a tab. Called initially on startup and
 * once a tab has been created.
 *
 * @param tab Tab with the page action to show
 */
function update_page_action (tab) {
    browser.pageAction.show(tab.id);

    const action_title = {
        tabId: tab.id
      , title: tab.status === "loading"
            ? page_action_title_busy
            : page_action_title_idle
    };

    browser.pageAction.setTitle(action_title);
    browser.browserAction.setTitle(action_title);

    update_page_action_icon(tab);
}


function on_action_clicked (tab) {
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
        });
    } else {
        browser.tabs.reload()
    }
}

browser.pageAction.onClicked.addListener(on_action_clicked);
browser.browserAction.onClicked.addListener(on_action_clicked);


// Show page action on all tabs
browser.tabs.query({}).then(tabs => {
    for (const tab of tabs) {
        update_page_action(tab);
    }
});

// Show page action on new tabs
browser.tabs.onCreated.addListener(tab => {
    update_page_action(tab);
})

// Show/update page action on navigation
browser.tabs.onUpdated.addListener((tab_id, info, tab) => {
    if ("status" in info) {
        update_page_action(tab);
    }
});



/**
 * bypassCache on reload only applies to content loaded with
 * the page. For anything loaded after, the cache must be
 * cleared properly.
 */
function empty_cache_and_hard_reload () {
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
        case "empty_cache_and_hard_reload":
            empty_cache_and_hard_reload();
            break;
    }
});


browser.menus.create({
    id: "normal_reload"
  , title: _("page_action_context_normal_reload_title")
  , command: "_execute_page_action"
  , contexts: [
        "page_action"
      , "browser_action"
    ]
});
browser.menus.create({
    id: "hard_reload"
  , title: _("page_action_context_hard_reload_title")
  , contexts: [
        "page_action"
      , "browser_action"
    ]
});
browser.menus.create({
    id: "empty_cache_and_hard_reload"
  , title: _("page_action_context_empty_cache_and_hard_reload_title")
  , contexts: [
        "page_action"
      , "browser_action"
    ]
})

browser.menus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        // Reload without cached content
        case "hard_reload":
            browser.tabs.reload({
                bypassCache: true
            });
            break;

        case "empty_cache_and_hard_reload":
            empty_cache_and_hard_reload();
            break;
    }
});
