# Reloader

Firefox add-on for a reload button as a page action

## Keyboard Shortcuts

<table>
    <tr>
        <td><b>Command<b></td>
        <td><b>Windows / Linux</b></td>
        <td><b>macOS</b></td>
    </tr>
    <tr>
        <td>Reload</td>
        <td>
            <code>F5</code><br>
            <code>Ctrl</code> + <code>R</code>
        </td>
        <td>
            <code>F5</code><br>
            <code>⌘</code> + <code>R</code>
        </td>
    </tr>
    <tr>
        <td>Hard Reload</td>
        <td>
            <code>Ctrl</code> + <code>F5</code><br>
            <code>Ctrl</code> + <code>Shift</code> + <code>R</code>
        </td>
        <td>
            <code>⌘</code> + <code>F5</code><br>
            <code>⌘</code> + <code>Shift</code> + <code>R</code>
        </td>
    </tr>
    <tr>
        <td>Empty Cache and Hard Reload</td>
        <td>
            <code>Ctrl</code> + <code>Shift</code> + <code>F5</code>
        </td>
        <td>
            <code>⌘</code> + <code>Shift</code> + <code>F5</code>
        </td>
    </tr>
</table>

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

/* Browser action ID */
#reloader_matt_tf-browser-action {
    /* ... */
}
````

Move to the end of the url bar:
````css
#pageAction-urlbar-reloader_matt_tf {
    -moz-box-ordinal-group: 2 !important;
}
````
