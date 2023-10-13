import type { Command } from './commands';
import type { TabInfo } from './tabs';

export const MSG = {
    openExtensions: 'openExtensions',
    closeCurrentTab: 'closeCurrentTab',
    duplicateTab: 'duplicateTab',

    loadAllCommands: 'loadAllCommands',
    loadClosedTabCommands: 'loadClosedTabCommands',
    loadCurrentTabs: 'loadCurrentTabs',
};

export type Message = {
    switchToTabId?: number;
    removeTabId?: number;
    moveTabOffset?: number;
    reopenTab?: TabInfo;

    directive?: keyof typeof MSG;
};

export type CommandMessageResponse = {
    bookmarkCommands?: Command[];
    currentTabCommands?: Command[];
    closedTabCommands?: Command[];
}

type ResponseCallback = (response: any) => void;

export function sendMessage(messageOrString: Message | string, responseCallback?: ResponseCallback) {
    let message: any;
    if (typeof messageOrString === 'string') {
        message = { directive: messageOrString };
    } else {
        message = messageOrString;
    }
    chrome.runtime.sendMessage(message, responseCallback);
}
