import { Msg, sendMessage } from './messages';
import { getPRs } from './prs';

export enum Mode {
    COMMAND_CENTER = 'COMMAND_CENTER',
    TAB_CENTER = 'TAB_CENTER',
    QUICK_LINKS = 'QUICK_LINKS'
}

export enum CommandType {
    BOOKMARK = 'BOOKMARK',
    CURRENT_TAB = 'CURRENT_TAB',
    CLOSED_TAB = 'CLOSED_TAB',
    PR = 'PR',
    EXACT = 'EXACT'
}

export const COMMAND_TYPE_LABELS = {
    [CommandType.BOOKMARK]: 'bookmark',
    [CommandType.CURRENT_TAB]: 'current',
    [CommandType.CLOSED_TAB]: 'closed',
    [CommandType.PR]: 'PR',
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
            url: tab.url!,
            title: tab.title!,
            sortDate: index
        };
    })
}

export function loadClosedTabCommands(callback: (commands: Command[]) => void) {
    sendMessage(Msg.loadClosedTabCommands, (response) => {
        callback(response.closedTabCommands);
    });
}

const GITHUB_FAVICON_URL = 'https://github.githubassets.com/favicons/favicon-dark.svg';
export async function loadPRCommands(githubUsername: string): Promise<Command[]> {
    const prs = await getPRs(githubUsername);
    return prs.map(pr => {
        return {
            type: CommandType.PR,
            id: `pr-${pr.id}`,
            icon: GITHUB_FAVICON_URL,
            url: pr.url,
            title: pr.searchEntry,
            sortDate: pr.lastVisitTime
        };
    });
}

export async function loadBookmarkCommands(): Promise<Command[]> {
    return bookmarksToCommands(await getRootBookmarks());
}

export type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
export async function getRootBookmarks(): Promise<BookmarkTreeNode[]> {
    const rootNode = await chrome.bookmarks.getTree()
    const bookmarksBarNode = rootNode[0]?.children?.filter(node => node.title?.startsWith('Bookmarks'));
    if (!bookmarksBarNode?.length) {
        return [];
    }
    return bookmarksBarNode[0]?.children ?? [];
}

type TitleMap = Record<string, string>;
function bookmarksToCommands(rootBookmarks: BookmarkTreeNode[]): Command[] {
    const flattened = flattenTree(rootBookmarks);
    flattened.sort((a, b) => Number(a.id) - Number(b.id));
    const fullTitleMap: TitleMap = flattened.reduce((ftm: TitleMap, bm) => {
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
                url: bm.url!,
                title: fullTitleMap[bm.id],
                sortDate
            };
        });
}

function flattenTree(data: BookmarkTreeNode[]): BookmarkTreeNode[] {
    return data.reduce((r: BookmarkTreeNode[], { children, ...rest }) => {
        r.push(rest);
        children && r.push(...flattenTree(children));
        return r;
    }, []);
}

export function faviconUrl(link?: string): string {
    if (link?.includes('https')) {
        if (!link.includes('lcloud.com')) {
            return `https://www.google.com/s2/favicons?domain=${link}&sz=64`;
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
