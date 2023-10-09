<script lang="ts">
    import CommandCenter from './CommandCenter.svelte';

    let focusCommandInputRef = false;

    import {
        Command,
        loadCurrentTabCommands,
        loadBookmarkCommands,
        loadClosedTabCommands,
    } from '../commands';
    //
    let bookmarkCommands: Command[] = [];
    let currentTabCommands: Command[] = [];
    let closedTabCommands: Command[] = [];

    loadBookmarkCommands().then((commands: Command[]) => bookmarkCommands = commands);
    loadCurrentTabCommands().then((commands: Command[]) => currentTabCommands = commands);
    loadClosedTabCommands((commands: Command[]) => closedTabCommands = commands);

    // let exactCommands: Command[] = [
    //     {
    //         type: CommandType.EXACT,
    //         id: EXACT_ID_GE,
    //         icon: DEFAULT_FAVICON_URL,
    //         url: 'chrome://extensions',
    //         title: 'ge - Go to Extensions',
    //         sortDate: 0
    //     }
    // ];
    // let allCommands: Command[] = [];
    // $: allCommands = [...exactCommands, ...currentTabCommands, ...bookmarkCommands, ...recentTabCommands];
    // let queryCommands: Command[];
    // $: queryCommands = searchCommands(allCommands, query);
    //
    // getBookmarks().then((bookmarks) => {
    //     allCommands = allCommands.concat(bookmarks);
    // });
    //
    // chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT}).then(tabs => {
    //     allCommands = allCommands.concat(tabs.map((tab, index) => {
    //         return {
    //             type: CommandType.CURRENT_TAB,
    //             id: tab.id.toString() ?? index.toString(),
    //             icon: tab.favIconUrl ?? DEFAULT_FAVICON_URL,
    //             url: tab.url ?? '',
    //             title: tab.title ?? '',
    //             sortDate: index
    //         };
    //     }));
    // });
    //
    // chrome.runtime.sendMessage({ getRecentlyClosedTabs: true }, (response) => {
    //     if (response?.recentlyClosedTabs) {
    //         allCommands = allCommands.concat(response.recentlyClosedTabs.map(tabInfo => {
    //             return {
    //                 type: CommandType.RECENT_TAB,
    //                 id: `${CommandType.RECENT_TAB}-${tabInfo.id}`,
    //                 icon: tabInfo.favIconUrl,
    //                 url: tabInfo.url,
    //                 title: tabInfo.title,
    //                 sortDate: tabInfo.closeDate
    //             };
    //         }));
    //     }
    // });
    //

    function toggleFocusCommandInputRef() {
        focusCommandInputRef = true;
        setTimeout(() => {
            focusCommandInputRef = false;
        }, 10);
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="container" on:click={() => toggleFocusCommandInputRef()}>
    <CommandCenter
            largeWidth
            escapeHandler={() => {}}
            renderingInPage={false}
            {focusCommandInputRef}
            {bookmarkCommands}
            {currentTabCommands}
            {closedTabCommands}
    />
</div>

<style lang="scss">
    @import '../colors';

    .container {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: $kh-black;
        height: 100vh;
    }
</style>
