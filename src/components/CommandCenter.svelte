<script lang="ts">
    import { Fzf, type FzfResultItem } from 'fzf';
    import HighlightText from './HighlightText.svelte';
    import CommandTypeBadge from './CommandTypeBadge.svelte';

    import {
        type Command,
        CommandType,
        DEFAULT_FAVICON_URL,
        MAX_COMMAND_TYPE_LABEL_LENGTH,
        Mode,
        padCommandTypeLabel,
    } from '../comms/commands';
    import { type CommandMessageResponse, Msg, sendMessage } from '../comms/messages';
    import { offsetSelectedIndex, switchToTab } from './utils';

    const EXACT_ID_PRC = 'prc';
    const EXACT_ID_TC = 'tc';
    const EXACT_ID_GE = 'ge';

    /** Props */
    export let largeWidth = false;
    export let focusInputRef = false;
    export let escapeHandler: () => void;
    export let switchModeHandler: (mode: Mode) => void;
    export let renderingInPage: boolean;
    $: if (focusInputRef) {
        commandInputRef?.focus();
    }

    /** State */
    let query = '';
    let commandInputRef: HTMLInputElement;
    let selectedIndex = 0;
    let loading = false;

    let bookmarkCommands: Command[] = [];
    let currentTabCommands: Command[] = [];
    let closedTabCommands: Command[] = [];
    let prCommands: Command[] = [];

    sendMessage(Msg.loadAllCommands, (response: CommandMessageResponse) => {
        bookmarkCommands = response.bookmarkCommands ?? [];
        currentTabCommands = response.currentTabCommands ?? [];
        closedTabCommands = response.closedTabCommands ?? [];
        prCommands = response.prCommands ?? [];
    });

    let exactCommands: Command[] = [
        {
            type: CommandType.EXACT,
            id: EXACT_ID_PRC,
            icon: DEFAULT_FAVICON_URL,
            url: '',
            title: 'prc - PR Center',
            sortDate: 0
        },
        {
            type: CommandType.EXACT,
            id: EXACT_ID_TC,
            icon: DEFAULT_FAVICON_URL,
            url: '',
            title: 'tc - Tab Center',
            sortDate: 0
        },
        {
            type: CommandType.EXACT,
            id: EXACT_ID_GE,
            icon: DEFAULT_FAVICON_URL,
            url: '',
            title: 'ge - Go to Extensions',
            sortDate: 0
        }
    ];

    let allCommands: Command[] = [];
    $: allCommands = [...exactCommands, ...currentTabCommands, ...bookmarkCommands, ...prCommands, ...closedTabCommands];
    let queryCommands: Command[];
    $: queryCommands = searchCommands(allCommands, query);

    function searchSelector(command: Command): string {
        const { isSearchUrl, url, title, type } = command;
        let content = isSearchUrl ? url : title.replaceAll('-', ' ');
        const typePadded = padCommandTypeLabel(type);
        return typePadded + content;
    }

    function searchCommands(commands: Command[], search: string): Command[] {
        const searchUrlCommands = commands.map(command => ({ ...command, isSearchUrl: true }));
        let commandsToSearch: Command[] = [
            ...commands,
            ...searchUrlCommands.filter(command => command.type !== CommandType.PR)
        ];
        const fzf = new Fzf(commandsToSearch, {
            selector: searchSelector,
            tiebreakers: [typeTieBreaker, dateTieBreaker]
        });

        const results: FzfResultItem<Command>[] = fzf.find(search.replaceAll(' ', '').replace('-', ' '));
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
        }).slice(0, 12);
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

    function doCommand(index: number, metaKey?: boolean) {
        loading = true;

        const command = queryCommands[index];
        if (command.type === CommandType.CURRENT_TAB) {
            switchToTab(command.id, renderingInPage);
        } else if (command.type === CommandType.EXACT) {
            if (command.id === EXACT_ID_PRC) {
                switchModeHandler?.(Mode.PR_CENTER);
            } else if (command.id === EXACT_ID_TC) {
                switchModeHandler?.(Mode.TAB_CENTER);
            } else if (command.id === EXACT_ID_GE) {
                sendMessage(Msg.openExtensions);
                !renderingInPage && window.close();
            }
        } else {
            const existingTab = currentTabCommands.find(tabCommand => tabCommand.url === command.url);
            // If Cmd-Enter, never reuse an existing tab
            if (!metaKey && existingTab) {
                switchToTab(existingTab.id, renderingInPage);
            } else {
                window.location.href = command.url;
            }
        }

        renderingInPage && escapeHandler();
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
            selectedIndex = offsetSelectedIndex(-1, selectedIndex, queryCommands.length);
        } else if (key === 'ArrowDown') {
            selectedIndex = offsetSelectedIndex(1, selectedIndex, queryCommands.length);
        } else if (key === 'Enter' && queryCommands[selectedIndex]) {
            doCommand(selectedIndex, event.metaKey);
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
    <div class="input-container" class:loading={loading}>
        <!-- svelte-ignore a11y-autofocus -->
        <input class="command-input"
               bind:this={commandInputRef}
               bind:value={query}
               on:keydown={handleInputKey}
               spellcheck="false"
               autocomplete="false"
               placeholder="Search commands..."
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
                    {#if command.url?.length}
                <HighlightText
                        text={command.url}
                        shouldHighlight={command.isSearchUrl}
                        indices={command.matchIndices}
                />
                {/if}
            </span>
            </a>
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
        @include container-base;

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
            overflow-x: hidden;
            width: 100%;

            .command {
                @include list-border;
                display: flex;
                align-items: center;
                padding: 5px 0;
                height: 60px;
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
                    display: flex;
                    flex-direction: column;
                    justify-content: space-evenly;
                    width: calc(100% - 200px);
                }
            }
        }
    }


</style>
