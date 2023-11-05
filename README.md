# CommandCenter

> Fuzzy search through bookmarks, commands and tabs. Accessible via New Tab or on any page with configured keybindings

## Todo
- [ ] Favicon cache and overrides so it doesn't spam with failed network requests off VPN
- [ ] Set up opinionated auto linting
- [ ] Track frequency of the Bookmarks and weight recently used ones to the top
- [ ] Add option to Blacklist Current Domain like uBlock does
- [ ] Actually use settings.scrollSmooth
- [ ] Document code files for adding siteScripts and vimKeys
- [ ] GitHub Actions
    - [ ] Action to deploy build to Chrome Web Store
- [x] Handle hover mode better - it's hard to tell difference of selectedIndex and hover
- [x] Use Switch.svelte from other extension

## Development

```bash
# install dependencies
npm i

# build files to `/dist` directory
npm run start
```

## Build

```bash
# build files to `/dist` directory
$ npm run build
```

## Load unpacked extensions

[Getting Started Tutorial](https://developer.chrome.com/docs/extensions/mv3/getstarted/)

1. Open the Extension Management page by navigating to `chrome://extensions`.
2. Enable Developer Mode by clicking the toggle switch next to `Developer mode`.
3. Click the `LOAD UNPACKED` button and select the `/dist` directory.

![Example](https://wd.imgix.net/image/BhuKGJaIeLNPW9ehns59NfwqKxF2/vOu7iPbaapkALed96rzN.png?auto=format&w=571)
