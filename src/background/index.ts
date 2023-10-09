import {
    Command, CommandType,
    loadBookmarkCommands, LoadCommandsResponse,
    loadCurrentTabCommands,
    TabInfo
} from '../commands';

// Background service workers
// https://developer.chrome.com/docs/extensions/mv3/service_workers/

chrome.runtime.onInstalled.addListener(() => {
    // storage.get().then(console.log);
});

type Message = {
    openExtensions?: boolean;
    closeCurrentTab?: boolean;
    duplicateTab?: boolean;
    switchToTabId?: number;
    moveTabOffset?: number;

    textBack?: string;

    loadClosedTabCommands?: boolean;
    loadAllCommands?: boolean;
};

chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
        if (!sender.tab) {
            console.error('Ignoring request, no tab', message, sender);
            return;
        }

        if (message.openExtensions) {
            chrome.tabs.create({ url: 'chrome://extensions' });
        } else if (message.closeCurrentTab) {
            chrome.tabs.remove(sender.tab.id, () => {});
        } else if (message.duplicateTab) {
            chrome.tabs.duplicate(sender.tab.id);
        } else if (message.switchToTabId !== undefined) {
            chrome.tabs.update(message.switchToTabId, { active: true });
        } else if (message.moveTabOffset !== undefined) {
            chrome.tabs.move(sender.tab.id, {
                index: sender.tab.index + message.moveTabOffset
            });
        } else if (message.loadAllCommands) {
            loadAllCommands().then(response => {
                sendResponse(response);
            });
        } else if (message.loadClosedTabCommands) {
            sendResponse({
                closedTabCommands: getClosedTabCommands()
            });
        }
        return true;
    }
);

const tabs: { [tabId: string]: TabInfo } = {};
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        const { url, title, id, favIconUrl } = tab;
        if (url?.startsWith('https')) {
            tabs[id] = {
                url: url ?? '',
                title: title ?? '',
                id: id?.toString() ?? '',
                favIconUrl: favIconUrl ?? '',
                closeDate: 0
            };
        }
    }
});

const closedCount = 50;
const closedTabs: TabInfo[] = [];
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    const removedTab = tabs[tabId];
    if (removedTab) {
        delete tabs[tabId];
        closedTabs.splice(0, 0, {
            ...removedTab,
            closeDate: Number(new Date())
        });
        if (closedTabs.length > closedCount) {
            closedTabs.splice(closedCount - 1, 1);
        }
    }
});

function getClosedTabCommands(): Command[] {
    return closedTabs.map(tabInfo => {
        return {
            type: CommandType.CLOSED_TAB,
            id: `${CommandType.CLOSED_TAB}-${tabInfo.id}`,
            icon: tabInfo.favIconUrl,
            url: tabInfo.url,
            title: tabInfo.title,
            sortDate: tabInfo.closeDate
        };
    });
}

async function loadAllCommands(): Promise<LoadCommandsResponse> {
    const currentTabCommands = await loadCurrentTabCommands();
    const bookmarkCommands = await loadBookmarkCommands();
    const closedTabCommands = getClosedTabCommands();
    return {
        bookmarkCommands, currentTabCommands, closedTabCommands
    };
}
