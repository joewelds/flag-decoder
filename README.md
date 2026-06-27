# Flag Emoji Tooltip

A small Firefox WebExtension that adds hover tooltips to flag emojis. When you hover a country flag emoji like 🇨🇷, the browser tooltip shows the country name and region code, for example `Costa Rica (CR)`.

It also recognizes England, Scotland, Wales, and a few common non-country flag emojis such as the rainbow flag and pirate flag.

## Files

- `manifest.json` — Firefox extension manifest.
- `content/flag-tooltip.js` — scans page text and wraps flag emojis with tooltip spans.
- `content/flag-tooltip.css` — small visual cue: dotted underline and help cursor.
- `icons/` — simple SVG icon.

## Test in Firefox

1. Unzip this folder somewhere on your computer.
2. In Firefox, open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…**.
4. Select this extension's `manifest.json` file.
5. Open any page with flag emojis, such as: `🇨🇷 🇺🇸 🇬🇧 🏴󠁧󠁢󠁳󠁣󠁴󠁿`.
6. Hover over a flag emoji to see the tooltip.

Temporary add-ons are for testing and may be removed when Firefox restarts. For permanent installation in normal Firefox, the extension generally needs to be signed through Mozilla Add-ons.

## Notes

- This extension does not send data anywhere.
- It uses the browser's built-in `Intl.DisplayNames` feature to convert country codes to readable country names.
- It skips script, style, form controls, code blocks, editable text, SVG, and canvas areas to reduce page breakage.
