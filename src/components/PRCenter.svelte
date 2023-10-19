<script lang="ts">
    import HighlightText from './HighlightText.svelte';
    import { Fzf, type FzfResultItem } from 'fzf';
    import { Msg, sendMessage } from '../comms/messages';
    import type { PR, PRMessageResponse } from '../comms/prs';
    import { offsetSelectedIndex, switchToTab } from './utils';

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

    let prs: PR[] = [];

    sendMessage(Msg.loadPRs, (response: PRMessageResponse) => {
        prs = response.prs ?? [];
    });

    $: if (query) {
        selectedIndex = 0;
    }

    let queryPRs: PR[];
    $: {
        queryPRs = searchPRs(prs, query);
        selectedIndex = offsetSelectedIndex(0, selectedIndex, queryPRs.length);
    }

    function searchSelector(pr: PR): string {
        return pr.title.replaceAll('-', ' ');
    }

    function searchPRs(prs: PR[], search: string): PR[] {
        const fzf = new Fzf(prs, {
            selector: searchSelector,
            tiebreakers: [dateTieBreaker]
        });

        const results: FzfResultItem<PR>[] = fzf.find(search.replaceAll(' ', ''));
        return results.map(item => {
            return { ...item.item, matchIndices: item.positions };
        });
    }

    function dateTieBreaker(a: FzfResultItem<PR>, b: FzfResultItem<PR>): number {
        return b.item.lastVisitTime - a.item.lastVisitTime;
    }

    function openPR(prId: string) {
        if (!prId) return;
        if (renderingInPage) {
            sendMessage({ switchToTabId: Number(tabId )});
        } else {
            chrome.tabs.update(Number(tabId), { active: true });
        }
    }

    function handleInputKey(event: KeyboardEvent) {
        let key = event.key;
        if (key === 'Tab') {
            event.preventDefault();
            key = event.shiftKey ? 'ArrowUp' : 'ArrowDown';
        }

        let prId = selectedIndex in queryPRs ? queryPRs[selectedIndex]?.id : null;
        if (key === 'ArrowUp') {
            selectedIndex = offsetSelectedIndex(-1, selectedIndex, queryPRs.length);
        } else if (key === 'ArrowDown') {
            selectedIndex = offsetSelectedIndex(1, selectedIndex, queryPRs.length);
        } else if (key === 'Enter') {
            openPR(prId);
        } else if (key === 'Escape') {
            if (query) {
                selectedIndex = 0;
                query = '';
            } else {
                escapeHandler();
            }
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="prs-container" class:large-width={largeWidth} on:click|stopPropagation>
    <!-- svelte-ignore a11y-autofocus -->
    <div class="input-container">
        <input class="pr-input"
               bind:this={tabInputRef}
               bind:value={query}
               on:keydown={handleInputKey}
               spellcheck="false"
               autocomplete="false"
               placeholder="Search prs..."
               maxlength="20"
               autofocus
        >
    </div>
    <div class="prs-list">
    {#each queryPRs as pr, index (pr.id)}
        <div
           class="pr"
           class:selected={index === selectedIndex}
           on:click={() => switchToTab(pr.id, renderingInPage)}
        >
            <span class="pr-icon">
                <img src={pr.favIconUrl} alt={pr.title} />
            </span>
            <span class="pr-highlight-texts">
                <HighlightText
                        text={pr.title}
                        indices={pr.matchIndices}
                />
            </span>
        </div>
    {/each}
    </div>
</div>

<style lang="scss">
    @import '../assets/colors';
    @import '../assets/mixins';

    @mixin list-border {
        border: 1px solid $kh-gray;
        border-left: none;
        border-right: none;
    }

    .prs-container {
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

            .pr-input {
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

        .prs-list {
            list-style-type: none;
            margin: 0;
            padding: 0;
            overflow: scroll;
            overflow-x: hidden;
            width: 100%;

            .pr {
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

                .pr-icon {
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

                .pr-highlight-texts {
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
