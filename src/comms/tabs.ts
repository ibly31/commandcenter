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
    reopenedTab?: TabInfo;
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

export function chromeTabToTabInfo(tab: chrome.tabs.Tab): TabInfo {
    const id = (tab.id ?? -1).toString();
    return {
        id: id,
        url: tab.url!,
        title: tab.title!,
        favIconUrl: tab.favIconUrl || DEFAULT_FAVICON_URL,
        pinned: tab.pinned,
        index: tab.index
    };
}

export async function loadCurrentTabs(): Promise<TabInfo[]> {
    return chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }).then(tabs => {
        return tabs.map(chromeTabToTabInfo);
    });
}
