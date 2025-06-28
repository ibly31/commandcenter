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

// Extended type to include the new properties from Chrome's upcoming API changes
export interface ExtendedBookmarkTreeNode extends BookmarkTreeNode {
    folderType?: 'bookmarks-bar' | 'other' | 'mobile';
    syncing?: boolean;
}

export async function getRootBookmarks(): Promise<BookmarkTreeNode[]> {
    const rootNode = await chrome.bookmarks.getTree();
    
    // Handle the new dual storage system with robust backward compatibility
    const allBookmarksBarFolders: ExtendedBookmarkTreeNode[] = [];
    
    // Find all bookmarks bar folders across the tree
    function findBookmarksBarFolders(nodes: ExtendedBookmarkTreeNode[]) {
        for (const node of nodes) {
            // Use folderType if available (new API), fallback to title check (old API)
            // Be more flexible with title matching for better compatibility
            const isBookmarksBar = node.folderType === 'bookmarks-bar' || 
                (node.title && (
                    node.title.toLowerCase().includes('bookmarks bar') ||
                    node.title.toLowerCase().includes('bookmark bar') ||
                    node.title.toLowerCase().includes('favoritos') || // Spanish
                    node.title.toLowerCase().includes('favoris') ||   // French
                    node.title.toLowerCase().includes('bookmarks')    // Generic fallback
                ));
            
            if (isBookmarksBar) {
                allBookmarksBarFolders.push(node);
            }
            
            // Recursively search children
            if (node.children) {
                findBookmarksBarFolders(node.children);
            }
        }
    }
    
    findBookmarksBarFolders(rootNode as ExtendedBookmarkTreeNode[]);
    
    // If no bookmarks bar folders found, try alternative approach for backward compatibility
    if (allBookmarksBarFolders.length === 0) {
        // Fallback: look for the first folder that might be bookmarks bar
        // This handles cases where the title doesn't match our patterns
        if (rootNode[0]?.children && rootNode[0].children.length > 0) {
            // Return the first folder's children as a fallback
            return rootNode[0].children[0]?.children ?? [];
        }
        return [];
    }
    
    // Combine all bookmarks from all bookmarks bar folders
    const allBookmarks: BookmarkTreeNode[] = [];
    for (const bookmarksBarFolder of allBookmarksBarFolders) {
        if (bookmarksBarFolder.children) {
            allBookmarks.push(...bookmarksBarFolder.children);
        }
    }
    
    return allBookmarks;
}

// Utility function to get all bookmarks (not just bookmarks bar) for debugging
export async function getAllBookmarks(): Promise<ExtendedBookmarkTreeNode[]> {
    try {
        // Check if chrome.bookmarks API is available
        if (!chrome.bookmarks || !chrome.bookmarks.getTree) {
            console.warn('Chrome bookmarks API not available');
            return [];
        }
        
        const rootNode = await chrome.bookmarks.getTree();
        const allBookmarks: ExtendedBookmarkTreeNode[] = [];
        
        function flattenAllBookmarks(nodes: ExtendedBookmarkTreeNode[]) {
            for (const node of nodes) {
                allBookmarks.push(node);
                if (node.children) {
                    flattenAllBookmarks(node.children);
                }
            }
        }
        
        flattenAllBookmarks(rootNode as ExtendedBookmarkTreeNode[]);
        return allBookmarks;
    } catch (error) {
        console.warn('Error getting all bookmarks:', error);
        return [];
    }
}

// Utility function to check if the new API features are available
export async function hasNewBookmarkAPI(): Promise<boolean> {
    try {
        // Check if chrome.bookmarks API is available at all
        if (!chrome.bookmarks || !chrome.bookmarks.getTree) {
            console.warn('Chrome bookmarks API not available');
            return false;
        }
        
        const rootNode = await chrome.bookmarks.getTree();
        const allBookmarks = await getAllBookmarks();
        
        // Check if any bookmark has the new properties
        const hasNewProps = allBookmarks.some(bookmark => 
            'folderType' in bookmark || 'syncing' in bookmark
        );
        
        console.log('New bookmark API detection:', {
            totalBookmarks: allBookmarks.length,
            hasNewProps,
            sampleBookmark: allBookmarks[0] ? Object.keys(allBookmarks[0]) : []
        });
        
        return hasNewProps;
    } catch (error) {
        console.warn('Error checking for new bookmark API:', error);
        return false;
    }
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
            
            // // Handle syncing status for better user experience
            // // Only show indicators if the syncing property is explicitly available
            // const extendedBm = bm as ExtendedBookmarkTreeNode;
            let title = fullTitleMap[bm.id];
            //
            // // Only add visual indicators if the syncing property is explicitly set
            // // This prevents false positives in browsers that don't have the new API
            // if (extendedBm.syncing === false) {
            //     title = `[Local] ${title}`;
            // } else if (extendedBm.syncing === true) {
            //     title = `[Synced] ${title}`;
            // }
            // // If syncing is undefined (most browsers currently), don't add any indicator
            
            return {
                type: CommandType.BOOKMARK,
                id: `${CommandType.BOOKMARK}-${bm.id}`,
                icon: faviconUrl(bm.url),
                url: bm.url!,
                title,
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
