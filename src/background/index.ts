import {
    type Command,
    CommandType,
    loadBookmarkCommands,
    loadCurrentTabCommands,
} from '../comms/commands';
import { type CommandMessageResponse, type Message, MSG } from '../comms/messages';
import { loadCurrentTabs, makeSenderTab, type TabInfo } from '../comms/tabs';

// chrome.runtime.onInstalled.addListener(() => {
//      storage.get().then(console.log);
// });

chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
        if (!sender.tab) {
            console.error('Ignoring request, no tab', message, sender);
            return;
        }
        const senderTab = makeSenderTab(sender);
        if (message.directive) {
            if (message.directive === MSG.openExtensions) {
                chrome.tabs.create({ url: 'chrome://extensions' });
            } else if (message.directive === MSG.closeCurrentTab) {
                chrome.tabs.remove(senderTab.id, () => {});
            } else if (message.directive === MSG.duplicateTab) {
                chrome.tabs.duplicate(senderTab.id);
            } else if (message.directive === MSG.loadAllCommands) {
                loadAllCommands().then(sendResponse);
            } else if (message.directive === MSG.loadCurrentTabs) {
                loadCurrentTabs().then(currentTabs => {
                    sendResponse({ currentTabs });
                });
            } else if (message.directive === MSG.loadClosedTabCommands) {
                sendResponse({
                    closedTabCommands: getClosedTabCommands()
                });
            }
        } else if (message.switchToTabId !== undefined) {
            chrome.tabs.update(message.switchToTabId, { active: true });
        } else if (message.removeTabId !== undefined) {
            chrome.tabs.remove(message.removeTabId);
        } else if (message.reopenTab !== undefined) {
            chrome.tabs.create({
                index: message.reopenTab.index,
                url: message.reopenTab.url,
                active: false
            });
        } else if (message.moveTabOffset !== undefined) {
            chrome.tabs.move(senderTab.id, {
                index: senderTab.index + message.moveTabOffset
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
                pinned: tab.pinned,
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

async function loadAllCommands(): Promise<CommandMessageResponse> {
    const currentTabCommands = await loadCurrentTabCommands();
    const bookmarkCommands = await loadBookmarkCommands();
    const closedTabCommands = getClosedTabCommands();
    return {
        bookmarkCommands, currentTabCommands, closedTabCommands
    };
}
