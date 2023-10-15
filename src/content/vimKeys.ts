import { Action, Msg, postActionMessage, sendMessage } from '../comms/messages';
import { isFocusedOnInput, triggerPageOffset, urlIncludes } from './utils';

type KeyFunction = () => [
    string, () => void
];
export type KeyMap = { [key: string]: KeyFunction };

function makeKeyFunction(key: string, description: string, run: () => void): KeyMap {
    return {
        [key]: () => {
            return [
                description,
                run
            ];
        }
    }
}

export const G_KEY_MAP: KeyMap = {
    ...makeKeyFunction('g', 'Scroll to top of page', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }),
    ...makeKeyFunction('e', 'Open chrome://extensions page', () => {
        sendMessage(Msg.openExtensions);
    }),
    ...makeKeyFunction('n', 'Go to "Next Page" by incrementing last number in URL', () => {
        triggerPageOffset(1);
    }),
    ...makeKeyFunction('h', 'Alias for Go to "Next Page"', () => {
        triggerPageOffset(1);
    }),
    ...makeKeyFunction('d', 'Go to "Previous Page" by decrementing last number in URL', () => {
        triggerPageOffset(-1);
    }),
    ...makeKeyFunction('D', 'Duplicate current tab', () => {
        sendMessage(Msg.duplicateTab);
    }),
    ...makeKeyFunction('r', 'Open CommandCenter overlay on current page', () => {
        postActionMessage(Action.openCommandCenter)
    }),
    ...makeKeyFunction('t', 'Open TabCenter overlay on current page', () => {
        postActionMessage(Action.openTabCenter)
    }),
    ...makeKeyFunction('0', 'Move current tab all the way to the left, after pinned tabs', () => {
        postActionMessage(Action.openTabCenter)
    }),
    ...makeKeyFunction('$', 'Move current tab all the way to the right', () => {
        postActionMessage(Action.openTabCenter)
    }),
};

export const KEY_MAP: KeyMap = {
    ...makeKeyFunction('G', 'Scroll to bottom of page', () => {
        postActionMessage(Action.openTabCenter)
    }),
    ...makeKeyFunction('r', 'Reload page', () => {
        window.location.reload();
    }),
    ...makeKeyFunction('x', 'Close current tab', () => {
        sendMessage(Msg.closeCurrentTab);
    }),
    ...makeKeyFunction('<', 'Move current tab to left', () => {
        sendMessage({ moveTabOffset: -1 });
    }),
    ...makeKeyFunction('>', 'Move current tab to right', () => {
        sendMessage({ moveTabOffset: 1 });
    }),
};

export const VIM_KEYS_BLACKLIST = ['google.com'];
export const G_DOUBLE_TIME = 350;

export function setupVimKeys() {
    if (urlIncludes(VIM_KEYS_BLACKLIST)) {
        return;
    }

    let ANY_FOCUSED = false;
    let LAST_G_TIME = 0;

    window.addEventListener('focusin', () => ANY_FOCUSED = true);
    window.addEventListener('focusout', () => ANY_FOCUSED = false);
    window.addEventListener('keypress', event => {
        if (ANY_FOCUSED) {
            return;
        }

        if (isFocusedOnInput()) {
            return;
        }

        function withinDoubleTime() {
            return Number(new Date()) - LAST_G_TIME <= G_DOUBLE_TIME;
        }

        let key = event.key;
        if (event.shiftKey) {
            key = key.toUpperCase();
        }

        if (key === 'g' && !withinDoubleTime()) {
            LAST_G_TIME = Number(new Date());
        } else if (key in G_KEY_MAP) {
            if (withinDoubleTime()) {
                G_KEY_MAP[key]();
                LAST_G_TIME = 0;
            }
        } else if (key in KEY_MAP) {
            KEY_MAP[key]();
        }
    });
}
