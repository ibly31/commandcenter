<script lang="ts">
    import KeyboardEvent = chrome.input.ime.KeyboardEvent;
    import { Fzf, FzfResultItem } from 'fzf';
    import HighlightText from './HighlightText.svelte';
    import CommandTypeBadge from './CommandTypeBadge.svelte';

    import {
        Command,
        CommandType,
        padCommandTypeLabel,
        DEFAULT_FAVICON_URL,
        LoadCommandsResponse,
        MAX_COMMAND_TYPE_LABEL_LENGTH,
    } from '../commands';

    const EXACT_ID_GE = 'ge';

    /** Props */
    export let largeWidth = false;
    export let focusCommandInputRef = false;
    export let escapeHandler: () => void;
    export let renderingInPage: boolean;
    $: if (focusCommandInputRef) {
        commandInputRef?.focus();
    }

    /** State */
    let query = '';
    let commandInputRef: HTMLInputElement;
    let selectedIndex = 0;
    let loading = false;

    export let bookmarkCommands: Command[] = [];
    export let currentTabCommands: Command[] = [];
    export let closedTabCommands: Command[] = [];
    let exactCommands: Command[] = [
        {
            type: CommandType.EXACT,
            id: EXACT_ID_GE,
            icon: DEFAULT_FAVICON_URL,
            url: 'chrome://extensions',
            title: 'ge - Go to Extensions',
            sortDate: 0
        }
    ];

    if (renderingInPage) {
        chrome.runtime.sendMessage({ loadAllCommands: true }, (response: LoadCommandsResponse) => {
            bookmarkCommands = response?.bookmarkCommands ?? [];
            currentTabCommands = response?.currentTabCommands ?? [];
            closedTabCommands = response?.closedTabCommands ?? [];
        });
    }

    let allCommands: Command[] = [];
    $: allCommands = [...exactCommands, ...currentTabCommands, ...bookmarkCommands, ...closedTabCommands];
    let queryCommands: Command[];
    $: queryCommands = searchCommands(allCommands, query);

    function searchSelector(command: Command): string {
        const { isSearchUrl, url, title, type } = command;
        let content = isSearchUrl ? url : title.replaceAll('-', ' ');
        const typePadded = padCommandTypeLabel(type);
        return typePadded + content;
    }

    function searchCommands(commands: Command[], search: string): Command[] {
        let commandsToSearch: Command[] = [
            ...commands,
            ...commands.map(command => ({ ...command, isSearchUrl: true }))
        ];
        const fzf = new Fzf(commandsToSearch, {
            selector: searchSelector,
            tiebreakers: [typeTieBreaker, dateTieBreaker]
        });

        const results: FzfResultItem<Command>[] = fzf.find(search.replaceAll(' ', ''));
        selectedIndex = 0;
        const seenIds = new Set();
        return results.map(item => {
            const positivePositions = Array.from(item.positions ?? [])
                .map(pos => pos - MAX_COMMAND_TYPE_LABEL_LENGTH - 1)
                .filter(pos => pos >= 0);
            return { ...item.item, matchIndices: new Set(positivePositions) };
        }).filter(command => {
            if (seenIds.has(command.id)) {
                return false;
            }
            seenIds.add(command.id);
            return true;
        });
    }

    function typeTieBreaker(a: FzfResultItem<Command>, b: FzfResultItem<Command>): number {
        if (a.item.type === b.item.type) {
            return 0;
        } else if (a.item.type === CommandType.CURRENT_TAB) {
            return 1;
        }
        return 0;
    }

    function dateTieBreaker(a: FzfResultItem<Command>, b: FzfResultItem<Command>): number {
        return b.item.sortDate - a.item.sortDate;
    }

    function doCommand(index: number) {
        loading = true;

        const command = queryCommands[index];
        if (command.type === CommandType.CURRENT_TAB) {
            if (renderingInPage) {
                chrome.runtime.sendMessage({ switchToTabId: Number(command.id) });
            } else {
                chrome.tabs.update(Number(command.id), { active: true });
                closeWindow();
            }
        } else if (command.type === CommandType.EXACT) {
            if (command.id === EXACT_ID_GE) {
                chrome.runtime.sendMessage({ openExtensions: true });
                closeWindow();
            }
        } else {
            window.location.href = queryCommands[index].url;
        }

        renderingInPage && escapeHandler();
    }

    function closeWindow() {
        if (!renderingInPage) {
            window.close();
        }
    }

    function offsetSelectedIndex(offset: number) {
        selectedIndex = selectedIndex + offset;
        selectedIndex = Math.max(0, Math.min(selectedIndex, queryCommands.length - 1));
    }

    function handleInputKey(event: KeyboardEvent) {
        let key = event.key;
        if (loading) {
            if (key === 'Escape') {
                window.stop();
            loading = false;
        }
            return;
        }
        if (key === 'Tab') {
            event.preventDefault();
            key = event.shiftKey ? 'ArrowUp' : 'ArrowDown';
        }
        if (key === 'ArrowUp') {
            offsetSelectedIndex(-1);
        } else if (key === 'ArrowDown') {
            offsetSelectedIndex(1);
        } else if (key === 'Enter' && queryCommands[selectedIndex]) {
            doCommand(selectedIndex);
        } else if (key === 'Escape') {
            selectedIndex = 0;
            query = '';
            renderingInPage && escapeHandler();
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="commands-container" class:large-width={largeWidth} on:click|stopPropagation>
    <!-- svelte-ignore a11y-autofocus -->
    <div class="input-container" class:loading={loading}>
        <input class="command-input"
               bind:this={commandInputRef}
               bind:value={query}
               on:keydown={handleInputKey}
               spellcheck="false"
               autocomplete="false"
               placeholder="Search..."
               maxlength="20"
               autofocus
        >
        {#if loading}
            <div class="loading-bar"></div>
        {/if}
    </div>
    <div class="commands-list">
    {#each queryCommands as command, index (command.id)}
        <a href={command.url}
           class="command"
           class:selected={index === selectedIndex}
           on:click|preventDefault={() => doCommand(index)}
        >
            <span class="command-icon">
                <img src={command.icon} alt={command.title} />
            </span>
            <CommandTypeBadge type={command.type} />
            <span class="command-highlight-texts">
                <HighlightText
                        text={command.title}
                        shouldHighlight={!command.isSearchUrl}
                        indices={command.matchIndices}
                />
                <HighlightText
                        text={command.url}
                        shouldHighlight={command.isSearchUrl}
                        indices={command.matchIndices}
                />
            </span>
        </a>
    {/each}
    </div>
</div>

<style lang="scss">
    @import '../colors';

    @mixin list-border {
        border: 1px solid $kh-gray;
        border-left: none;
        border-right: none;
    }

    @keyframes loading-animation {
        0% {
            left: -40%;
        }
        50% {
            left: 20%;
            width: 80%;
        }
        100% {
            left: 100%;
            width: 100%;
        }
    }

    .commands-container {
        max-height: 80vh;
        min-width: 800px;
        width: 800px;
        max-width: 800px;
        background-color: black;
        border-radius: 15px;
        overflow: hidden;
        border: 3px solid $kh-silver;
        font-family: 'Inter', sans-serif;

        &.large-width {
            min-width: 1000px;
            width: 1000px;
            max-width: 1000px;
        }

        .input-container {
            width: 100%;
            border-bottom: 3px solid $kh-silver;

            &.loading {
                border-bottom: none;
            }

            .command-input {
                padding: 15px 20px;
                font-size: 1.5rem;
                color: $kh-white;
                background-color: transparent;
                width: 100%;
                border: none;

                &:focus {
                    outline: none;
                }
            }

            .loading-bar {
                width: 100%;
                height: 3px;
                bottom: 0;
                position: relative;
                overflow: hidden;
                background-color: $kh-silver;
                margin: 0 auto;

                &:before {
                    content: "";
                    position: absolute;
                    left: -50%;
                    height: 3px;
                    width: 40%;
                    background-color: $kh-pink;
                    animation: loading-animation 1s linear infinite;
                }
            }
        }

        .commands-list {
            list-style-type: none;
            margin: 0;
            padding: 0;
            overflow: scroll;

            .command {
                @include list-border;
                display: flex;
                align-items: center;
                padding: 5px 0;
                min-height: 60px;
                text-decoration: none;

                &:first-child {
                    border-top: none;
                }

                &.selected, &:hover {
                    background-color: $kh-blue;
                }

                .command-icon {
                    min-width: 60px;
                    display: flex;
                    justify-content: center;
                    align-items: center;

                    img {
                        width: 30px;
                        height: 30px;
                    }
                }


                .command-highlight-texts {
                    margin-left: 10px;
                    min-height: 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-evenly;
                }
            }
        }
    }


</style>
