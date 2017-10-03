"use strict";

const _ = browser.i18n.getMessage;


const dark_themes = [
    "Dark"
];

let is_theme_dark = false;

let page_action_title_idle = "";
let page_action_title_busy = "";


// Detect theme for icon contrast
browser.management.getAll().then(extensions => {
    const current_theme = extensions.filter(ext =>
            ext.type === "theme"
         && ext.enabled)[0];

    is_theme_dark = dark_themes.includes(current_theme.name);
    refresh_all_icons();
});

// Listen for theme changes to maintain icon contrast
browser.management.onEnabled.addListener(info => {
    if (info.type === "theme") {
        is_theme_dark = dark_themes.includes(info.name);
        refresh_all_icons();
    }
});

// Detect OS to set macOS shortcuts
browser.runtime.getPlatformInfo().then(info => {
    page_action_title_idle = _("page_action_idle_title"
          , `${info.os === "mac" ? "⌘" : "Ctrl"}+R`);
    page_action_title_busy = _("page_action_busy_title", "Esc");
});


function refresh_icon (tab) {
    const reload_icon_path = is_theme_dark
        ? "data/reload_dark.svg"
        : "data/reload_light.svg";
    const stop_icon_path = is_theme_dark
        ? "data/stop_dark.svg"
        : "data/stop_light.svg";

    browser.pageAction.setIcon({
        tabId: tab.id
      , path: tab.status === "loading"
            ? stop_icon_path
            : reload_icon_path
    });
}
function refresh_all_icons (tab_id = null) {
    browser.tabs.query({}).then(tabs => {
        for (const tab of tabs) {
            refresh_icon(tab);
        }
    });
}

function show_page_action (tab) {
    browser.pageAction.show(tab.id);
    browser.pageAction.setTitle({
        tabId: tab.id
      , title: page_action_title_idle
    });
    refresh_icon(tab);
}

browser.pageAction.onClicked.addListener(tab => {
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
});


// Show page action on all tabs
browser.tabs.query({}).then(tabs => {
    for (const tab of tabs) {
        show_page_action(tab);
    }
});

// Show page action on new tabs
browser.tabs.onCreated.addListener(tab => {
    show_page_action(tab);
})

browser.tabs.onUpdated.addListener((tab_id, info, tab) => {
    show_page_action(tab);
    if ("status" in info) {
        // Update title on reload/stop
        browser.pageAction.setTitle({
            tabId: tab_id
          , title: info.status === "loading"
                ? page_action_title_busy
                : page_action_title_idle
        });
        refresh_icon(tab);
    }
});


browser.menus.create({
    id: "normal_reload"
  , title: _("page_action_context_normal_reload_title")
  , command: "_execute_page_action"
  , contexts: [ "page_action" ]
});
browser.menus.create({
    id: "hard_reload"
  , title: _("page_action_context_hard_reload_title")
  , contexts: [ "page_action" ]
});

browser.menus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "hard_reload":
            browser.tabs.reload({
                bypassCache: true
            });
            break;
    }
});
