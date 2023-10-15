import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
import { Msg, sendMessage } from '../comms/messages';

export enum Mode {
    COMMAND_CENTER = 'COMMAND_CENTER',
    TAB_CONTROLLER = 'TAB_CONTROLLER'
}

export enum CommandType {
    BOOKMARK = 'BOOKMARK',
    CURRENT_TAB = 'CURRENT_TAB',
    CLOSED_TAB = 'CLOSED_TAB',
    EXACT = 'EXACT'
}

export const COMMAND_TYPE_LABELS = {
    [CommandType.BOOKMARK]: 'bookmark',
    [CommandType.CURRENT_TAB]: 'current',
    [CommandType.CLOSED_TAB]: 'closed',
    [CommandType.EXACT]: 'command'
};

export const MAX_COMMAND_TYPE_LABEL_LENGTH = Object.values(COMMAND_TYPE_LABELS).reduce(
    function (a, b) {
        return a.length > b.length ? a : b;
    }
).length;

export function padCommandTypeLabel(type: CommandType) {
    const typeLabel = COMMAND_TYPE_LABELS[type];
    return typeLabel + "/".repeat(MAX_COMMAND_TYPE_LABEL_LENGTH - typeLabel.length + 1);
}

export type Command = {
    type: CommandType;
    id: string;
    icon: string;
    url: string;
    title: string;
    sortDate?: number;
    isSearchUrl?: boolean;
    matchIndices?: Set<number>;
};

export const DEFAULT_FAVICON_URL = 'https://iterm2.com/favicon.ico';

export async function loadCurrentTabCommands(): Promise<Command[]> {
    return chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }).then(currentTabsToCommands);
}

function currentTabsToCommands(tabs: chrome.tabs.Tab[]): Command[] {
    return tabs.map((tab, index) => {
        const id = (tab.id ?? index).toString();
        return {
            type: CommandType.CURRENT_TAB,
            id: id,
            icon: tab.favIconUrl ?? DEFAULT_FAVICON_URL,
            url: tab.url ?? '',
            title: tab.title ?? '',
            sortDate: index
        };
    })
}

export function loadClosedTabCommands(callback: (commands: Command[]) => void) {
    sendMessage(Msg.loadClosedTabCommands, (response) => {
        callback(response.closedTabCommands);
    });
}

export async function loadBookmarkCommands(): Promise<Command[]> {
    return bookmarksToCommands(await chrome.bookmarks.getTree());
}

function bookmarksToCommands(rootNode: BookmarkTreeNode[]): Command[] {
    const bookmarksBar = rootNode[0]?.children?.filter(node => node.title === 'Bookmarks Bar');
    const flattened = flattenTree(bookmarksBar[0]?.children);
    flattened.sort((a, b) => Number(a.id) - Number(b.id));
    const fullTitleMap: { [id: string]: string } = flattened.reduce((ftm, bm) => {
        let fullTitle = bm.title;
        if (bm.parentId && bm.parentId in ftm) {
            fullTitle = ftm[bm.parentId] + ' > ' + fullTitle;
        }
        ftm[bm.id] = fullTitle;
        return ftm;
    }, {});
    return flattened
        .filter(bm => !!bm.url)
        .map(bm => {
            const sortDate: number | undefined = 'dateLastUsed' in bm ? bm['dateLastUsed'] as number : bm.dateAdded;
            return {
                type: CommandType.BOOKMARK,
                id: `${CommandType.BOOKMARK}-${bm.id}`,
                icon: faviconUrl(bm.url),
                url: bm.url ?? '',
                title: fullTitleMap[bm.id],
                sortDate
            };
        });
}

function flattenTree(data: BookmarkTreeNode[]): BookmarkTreeNode[] {
    return data.reduce((r, { children, ...rest }) => {
        r.push(rest);
        children && r.push(...flattenTree(children));
        return r;
    }, [])
}

function faviconUrl(link?: string): string {
    link = link ?? '';
    if (link.includes('https')) {
        if (!link.includes('lcloud.com')) {
            return `https://www.google.com/s2/favicons?domain=${link}&sz=128`;
        }
        try {
            const url = new URL(link);
            return url.protocol + url.host + '/favicon.ico';
        } catch (e) {
            // pass
        }
    }
    return DEFAULT_FAVICON_URL;
}
