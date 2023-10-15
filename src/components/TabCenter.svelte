<script lang="ts">
    import HighlightText from './HighlightText.svelte';
    import CloseButton from './CloseButton.svelte';
    import TabPinnedButton from './TabPinnedButton.svelte';
    import { Fzf, type FzfResultItem } from 'fzf';
    import { Msg, sendMessage } from '../comms/messages';
    import type { TabInfo, TabMessageResponse } from '../comms/tabs';

    /** Props */
    export let largeWidth = false;
    export let focusInputRef = false;
    export let escapeHandler: () => void;
    export let renderingInPage: boolean;
    $: if (focusInputRef) {
        tabInputRef?.focus();
    }

    /** State */
    let query = '';
    let tabInputRef: HTMLInputElement;
    let selectedIndex = 0;

    let currentTabs: TabInfo[] = [];
    let closedTabs: TabInfo[] = [];

    sendMessage(Msg.loadCurrentTabs, (response: TabMessageResponse) => {
        currentTabs = response.currentTabs ?? [];
    });

    $: if (query) {
        selectedIndex = 0;
    }

    let queryTabs: TabInfo[];
    $: {
        queryTabs = searchTabs(currentTabs, query);
        offsetSelectedIndex(0);
    }

    function searchSelector(tab: TabInfo): string {
        return tab.title.replaceAll('-', ' ');
    }

    function searchTabs(tabs: TabInfo[], search: string): TabInfo[] {
        const fzf = new Fzf(tabs, {
            selector: searchSelector,
            tiebreakers: [dateTieBreaker]
        });

        const results: FzfResultItem<TabInfo>[] = fzf.find(search.replaceAll(' ', ''));
        return results.map(item => {
            return { ...item.item, matchIndices: item.positions };
        }).sort((a, b) => a.index - b.index);
    }

    function dateTieBreaker(a: FzfResultItem<TabInfo>, b: FzfResultItem<TabInfo>): number {
        return b.item.sortDate - a.item.sortDate;
    }

    function offsetSelectedIndex(offset: number) {
        selectedIndex = selectedIndex + offset;
        selectedIndex = Math.max(0, Math.min(selectedIndex, queryTabs.length - 1));
    }

    function removeTab(tabId: string) {
        if (!tabId) return;
        const tabIndex = currentTabs.findIndex(currentTab => currentTab.id === tabId);
        if (tabIndex !== -1) {
            const tab = currentTabs[tabIndex];
            if (tab.pinned) {
                return;
            }
            const closedTab = currentTabs.splice(tabIndex, 1)[0];
            currentTabs = [...currentTabs];
            sendMessage({ removeTabId: Number(tabId) });
            closedTabs.push(closedTab);
        }
    }

    function switchToTab(tabId: string) {
        if (!tabId) return;
        if (renderingInPage) {
            sendMessage({ switchToTabId: Number(tabId )});
        } else {
            chrome.tabs.update(Number(tabId), { active: true });
            closeWindow();
        }
    }

    function toggleTabPinned(tabId: string) {
        console.log('Toggling tab pinned', tabId);
    }

    function reopenTab() {
        const reopenTab: TabInfo = closedTabs.splice(closedTabs.length - 1, 1).at(0);
        reopenTab && sendMessage({ reopenTab }, (response: TabMessageResponse) => {
            currentTabs = response.currentTabs;
        });
    }

    function handleInputKey(event: KeyboardEvent) {
        let key = event.key;
        if (key === 'Tab') {
            event.preventDefault();
            key = event.shiftKey ? 'ArrowUp' : 'ArrowDown';
        }

        let tabId = selectedIndex in queryTabs ? queryTabs[selectedIndex]?.id : null;
        if (key === 'ArrowUp') {
            offsetSelectedIndex(-1);
        } else if (key === 'ArrowDown') {
            offsetSelectedIndex(1);
        } else if (key === 'Enter') {
            switchToTab(tabId);
        } else if (key === 'Escape') {
            if (query) {
                selectedIndex = 0;
                query = '';
            } else {
                escapeHandler();
            }
        } else if (key === 'Backspace') {
            const isTextSelected = window.getSelection()?.type === 'Range';
            if (!isTextSelected && queryTabs.length) {
                event.preventDefault();
                removeTab(tabId);
            }
        } else if (key === 'z' && event.metaKey) {
            reopenTab();
            event.preventDefault();
        }
    }

    function closeWindow() {
        if (!renderingInPage) {
            window.close();
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="tabs-container" class:large-width={largeWidth} on:click|stopPropagation>
    <!-- svelte-ignore a11y-autofocus -->
    <div class="input-container">
        <input class="tab-input"
               bind:this={tabInputRef}
               bind:value={query}
               on:keydown={handleInputKey}
               spellcheck="false"
               autocomplete="false"
               placeholder="Search tabs..."
               maxlength="20"
               autofocus
        >
    </div>
    <div class="tabs-list">
    {#each queryTabs as tab, index (tab.id)}
        <div
           class="tab"
           class:selected={index === selectedIndex}
           on:click={() => switchToTab(tab.id)}
        >
            <span class="tab-icon">
                <img src={tab.favIconUrl} alt={tab.title} />
            </span>
            <span class="tab-highlight-texts">
                <HighlightText
                        text={tab.title}
                        indices={tab.matchIndices}
                />
            </span>
            {#if tab.pinned}
                <TabPinnedButton onClick={() => toggleTabPinned(tab.id)} />
            {:else}
                <CloseButton onClick={() => removeTab(tab.id)} />
            {/if}
        </div>
    {/each}
    </div>
</div>

<style lang="scss">
    @import '../colors';
    @import '../containers';

    @mixin list-border {
        border: 1px solid $kh-gray;
        border-left: none;
        border-right: none;
    }

    .tabs-container {
        @include container-base;
        margin: 0;
        padding: 0;

        &.large-width {
            min-width: 1000px;
            width: 1000px;
            max-width: 1000px;
        }

        .input-container {
            width: 100%;
            border-bottom: 3px solid $kh-silver;

            .tab-input {
                padding: 15px 20px;
                font-size: 24px;
                color: $kh-white;
                background-color: transparent;
                width: 100%;
                border: none;

                &:focus {
                    outline: none;
                }

                &:focus-visible {
                    box-shadow: none;
                    outline: none !important;
                }
            }
        }

        .tabs-list {
            list-style-type: none;
            margin: 0;
            padding: 0;
            overflow: scroll;
            overflow-x: hidden;
            width: 100%;

            .tab {
                @include list-border;
                position: relative;
                display: flex;
                align-items: center;
                padding: 5px 0;
                text-decoration: none;
                width: 100%;

                &:first-child {
                    border-top: none;
                }

                &.selected, &:hover {
                    background-color: $kh-blue;
                }

                .tab-icon {
                    min-width: 30px;
                    margin-left: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;

                    img {
                        width: 20px;
                        height: 20px;
                    }
                }

                .tab-highlight-texts {
                    margin-left: 10px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-evenly;
                    width: calc(100% - 100px);
                }
            }
        }
    }
</style>
