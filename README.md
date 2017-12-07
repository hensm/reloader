# Reloader

Firefox add-on for a reload button as a page action


## Locale Licenses

The project is licensed under the MIT, though some localizations use already translated locale strings from other projects. Licenses for the strings taken from the Firefox/Chromium source repos are included in the `other_licenses` folder.

* Firefox locale strings:
    + page_action_idle_title
    + page_action_busy_title

* Chromium locale strings:
    + page_action_context_normal_reload_title
    + page_action_context_hard_reload_title
    + page_action_context_empty_cache_and_hard_reload_title


## Customizing

The icon color is customizable via userChrome.css. The icons use `context-fill` and `context-fill-opacity` to inherit colors from the stylesheet. By default, this functionality isn't enabled for anything but `chrome://` and `resource://` URLs. For it to work, you need to flip the `svg.context-properties.content.enabled` pref.

Then, in your stylesheet:

````css
/* Example colors, you can use whatever you want */
#reloader_matt_tf-page-action,
#pageAction-urlbar-reloader_matt_tf {
    fill: red;
    fill-opacity: 0.75;
}

/* Page action ID */
#reloader_matt_tf-browser-action {
    /* ... */
}
````
