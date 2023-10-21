<script lang="ts">
    import KeyFunctionDescription from './KeyFunctionDescription.svelte';
    import K from './Key.svelte';
    import { type IStorage, storage } from '../storage';
    import { G_KEY_MAP, KEY_MAP, type KeyMap } from '../content/vimKeys';

    /** State */

    let githubUsername = '';
    let gDoubleTime = 350;
    let vimKeysBlacklistCSV = '';
    storage.get().then((storage: IStorage) => {
        githubUsername = storage.githubUsername;
        gDoubleTime = storage.gDoubleTime;
        vimKeysBlacklistCSV = storage.vimKeysBlacklistCSV;
    });

    const csvUrlRe = /^[.a-z0-9,_ -]*$/
    let vimKeysBlacklistCSVInvalid = false;
    $: vimKeysBlacklistCSVInvalid = !csvUrlRe.test(vimKeysBlacklistCSV);

    function saveSettings() {
        storage.set({ githubUsername, gDoubleTime, vimKeysBlacklistCSV });
    }

    let debounceTimer: number;
    const handleSettingInputKey = (event: KeyboardEvent) => {
        clearTimeout(debounceTimer);
        if (event.key === 'Enter') {
            saveSettings();
            return;
        }
        debounceTimer = setTimeout(() => {
            saveSettings();
        }, 300)
    }

    type KeyFunctionInfo = {
        key: string;
        description: string;
    }

    function getKeyFunctionInfos(keyMap: KeyMap): KeyFunctionInfo[] {
        return Object.keys(keyMap).map((key: string) => {
            const [description] = [...keyMap[key]()];
            return { key, description };
        });
    }

    const gKeyFunctionInfos = getKeyFunctionInfos(G_KEY_MAP);
    const keyFunctionInfos = getKeyFunctionInfos(KEY_MAP);
</script>

<div class="readme-container">
    <h1>CommandCenter</h1>
    <p>CommandCenter is a utility for adding the following functionality:</p>
    <div class="li">"Fuzzy search" that uses
        <K small>fzf</K>
        that is more forgiving and uses substring search
    </div>
    <div class="li">CommandCenter: list of commands, bookmarks, current and recently closed tabs</div>
    <div class="li">TabCenter: allows you to search, jump to, close and reopen tabs</div>
    <div class="li">Keybindings to open both of these on any page, not just New Tab</div>
    <div class="li">Utility "Site Scripts" injected into configured webpages</div>
    <div class="li">Vim-style keybindings to every webpage</div>
    <h2>Command and Tab Center</h2>
    <p>
        Be sure to select "keep" when presented with the option when opening New Tab page for the first time
        Look at the G Key Bindings below to see how to access on any page, not just New Tab
        To use TabCenter, use the
        <K>tc</K>
        command or search for it and hit
        <K>enter</K>
    </p>
    <h2>Keybindings</h2>
    <p>Keybindings follow general Vim style</p>
    {#each keyFunctionInfos as kfi}
        <KeyFunctionDescription key={kfi.key} description={kfi.description} />
    {/each}
    <h2>G Keybindings</h2>
    <p>
        "G Keybindings" always are prefixed with lowercase
        <K>g</K>
        You must hit the second key within <K>{gDoubleTime}</K> milliseconds.
        Most have a mnemonic to help memorize.
        <K>gg</K>
        and
        <K>G</K>
    </p>
    {#each gKeyFunctionInfos as gkfi}
        <KeyFunctionDescription key={`g${gkfi.key}`} description={gkfi.description} />
    {/each}
    <h2>Settings</h2>
    <div class="setting-input">
        <label for="githubUsername">GitHub Username:</label>
        <input name="githubUsername"
               bind:value={githubUsername}
               on:keydown={handleSettingInputKey}
               spellcheck="false"
               autocomplete="false"
               placeholder="GitHub Username"
               minlength="3"
               maxlength="40"
               required
        >
    </div>
    <div class="setting-input">
        <label for="gDoubleTime"><K>G</K> Keybinding Timeout:</label>
        <input name="gDoubleTime"
               bind:value={gDoubleTime}
               on:keydown={handleSettingInputKey}
               type="number"
               min="100"
               max="3000"
               spellcheck="false"
               placeholder="Milliseconds"
               required
        >
    </div>
    <div class="setting-input">
        <label for="vimKeysBlacklistCSV">Vim Keys URL Blacklist:</label>
        <input name="vimKeysBlacklistCSV"
               bind:value={vimKeysBlacklistCSV}
               on:keydown={handleSettingInputKey}
               class:invalid={vimKeysBlacklistCSVInvalid}
               spellcheck="false"
               autocomplete="false"
               placeholder="google.com, example.com"
        >
    </div>
</div>

<style lang="scss">
    @import '../assets/colors';
    @import '../assets/mixins';

    .readme-container {
        @include system-font;
        display: flex;
        flex-direction: column;
        color: $kh-light;
        padding: 0 15px 50px 15px;
    }

    .li {
        margin: 3px;

        &:before {
            content: "•  "
        }
    }

    .setting-input {
        @include system-font;
        display: flex;
        height: 45px;
        align-items: baseline;
        font-size: 15px;

        label {
            margin-right: 10px;
            width: 35%;
        }

        input {
            margin-top: 5px;
            padding: 10px 10px;
            font-size: 15px;
            color: $kh-black;
            background-color: $kh-white;
            border: 1px solid $kh-silver;
            border-radius: 5px;
            flex-grow: 1;

            &:invalid, &.invalid {
                outline: 1px solid $kh-red;
            }
        }
    }

    h1, h2 {
        @include border-hr;
        text-align: center;
        margin: 15px 0 5px;
    }

    p {
        font-size: 15px;
        padding: 0 10px;
        margin: 10px 0;
        line-height: 1.4em;
    }
</style>
