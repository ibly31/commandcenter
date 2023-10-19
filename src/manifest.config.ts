import { defineManifest } from "@crxjs/vite-plugin";
import { version, description } from "../package.json";

const name = 'CommandCenter';

const icons = [16, 32, 48, 128].reduce((map, res) => {
    return { ...map, [res.toString()]: `src/assets/icons/icon-${res}.png` };
}, {});

export default defineManifest(async (env) => ({
    manifest_version: 3,
    name,
    description,
    version,
    version_name: version,
    icons,
    chrome_url_overrides: {
        newtab: "src/newtab/newtab.html"
    },
    content_scripts: [
        {
            matches: ["https://*/*"],
            js: ["src/content/index.ts", "src/content/commandcenter.ts"],
        },
    ],
    background: {
        service_worker: "src/background/index.ts",
    },
    options_ui: {
        page: "src/options/options.html",
        open_in_tab: false,
    },
    action: {
        default_popup: "src/popup/popup.html",
        default_icon: icons,
    },
    permissions: [
        "bookmarks",
        "history",
        "storage",
        "tabs"
    ] as chrome.runtime.ManifestPermissions[],
}));
