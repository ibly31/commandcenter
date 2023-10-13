import { DEFAULT_FAVICON_URL } from './commands';

export type TabInfo = {
    id: string;
    url: string;
    title: string;
    favIconUrl: string;
    closeDate?: number;
    pinned: boolean;
    index: number;
};

export type TabMessageResponse = {
    currentTabs?: TabInfo[];
}

type SenderTab = {
    id: number;
    index: number;
}

export function makeSenderTab(sender: chrome.runtime.MessageSender): SenderTab {
    return {
        id: sender.tab?.id ?? -1,
        index: sender.tab?.index ?? -1
    };
}

export async function loadCurrentTabs(): Promise<TabInfo[]> {
    return chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }).then(chromeTabsToTabInfo);
}

function chromeTabsToTabInfo(tabs: chrome.tabs.Tab[]): TabInfo[] {
    return tabs.map(tab => {
        const id = (tab.id ?? -1).toString();
        return {
            id: id,
            url: tab.url ?? '',
            title: tab.title ?? '',
            favIconUrl: tab.favIconUrl || DEFAULT_FAVICON_URL,
            pinned: tab.pinned,
            index: tab.index
        };
    })
}
