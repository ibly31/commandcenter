<script lang="ts">
    import HighlightText from './HighlightText.svelte';
    import { Fzf, type FzfResultItem } from 'fzf';
    import { type IStorage, storage } from '../storage';
    import { sendMessage } from '../comms/messages';
    import type { PR, PRMessageResponse } from '../comms/prs';
    import { offsetSelectedIndex, switchToTab } from './utils';

    /** Props */
    export let largeWidth = false;
    export let focusInputRef = false;
    export let escapeHandler: () => void;
    $: if (focusInputRef) {
        tabInputRef?.focus();
    }

    /** State */
    let githubApiToken = '';
    let query = '';
    let tabInputRef: HTMLInputElement;
    let selectedIndex = 0;

    let prs: PR[] = [];

    storage.get().then((storage: IStorage) => {
        githubApiToken = storage.githubApiToken;
    });

    $: sendMessage({
        loadPRsForGithubApiToken: githubApiToken
    }, (response: PRMessageResponse) => {
        console.log('rcv response', response);
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
        return pr.searchEntry.replaceAll('-', ' ');
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

    function openPR(prId: number) {
        if (!prId) return;
        // switchToTab(Number(prId));
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
    {#if !githubUsername}
        <div class="error-container">
            No configured Github Username - visit the extension Options
        </div>
    {:else}
        <!-- svelte-ignore a11y-autofocus -->
        <div class="input-container">
            <input class="pr-input"
                   bind:this={tabInputRef}
                   bind:value={query}
                   on:keydown={handleInputKey}
                   spellcheck="false"
                   autocomplete="false"
                   placeholder="Search Pull Requests..."
                   maxlength="20"
                   autofocus
            >
        </div>
        <div class="prs-list">
            {#each queryPRs as pr, index (pr.id)}
                <a href={pr.url}
                   class="pr"
                   class:selected={index === selectedIndex}
                   on:click={() => openPR(pr.id)}
                >
                    <span class="pr-icon">
                        <img src="https://github.githubassets.com/favicons/favicon-dark.svg" alt={pr.title} />
                    </span>
                    <span class="pr-highlight-texts">
                        <HighlightText
                                text={pr.searchEntry}
                                indices={pr.matchIndices}
                        />
                    </span>
                </a>
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
    @import '../assets/colors';
    @import '../assets/mixins';

    @mixin list-border {
        border: 1px solid $kh-gray;
        border-left: none;
        border-right: none;
    }

    .error-container {
        display: flex;
        justify-content: center;
        text-align: center;
        font-size: 36px;
        color: $kh-white;
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
