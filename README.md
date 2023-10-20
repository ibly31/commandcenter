# CommandCenter

> Fuzzy search through bookmarks, commands and tabs. Accessible via New Tab or on any page with configured keybindings

## Todo
- Reset storage.ts default username to empty string
- If TabCenter deletes the current tab, maybe find a way to open NewTab to TabCenter in same index and continue?
    - Alternately, disallow deleting current tab
- Make removal of tabs update the index of each item
- Favicon cache and overrides so it doesn't spam with failed network requests off VPN
- Figure out deploying to Chrome Web Store
- GitHub Actions
    - Action to build dist.zip as a Release?
    - Action to deploy build to Chrome Web Store

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
