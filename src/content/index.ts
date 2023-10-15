import { Action, Msg, postActionMessage, sendMessage } from '../comms/messages';

type Urls = string | string[];
function urlIncludes(urls: Urls) {
    if (!Array.isArray(urls)) {
        urls = [urls];
    }
    return urls.some(url => document.location.href.includes(url));
}

function retryAction(retrySeconds: number, interval: number, action: () => boolean) {
    function tryAction() {
        retrySeconds = retrySeconds - interval / 1000.0;
        if (retrySeconds <= 0) {
            return;
        }
        if (action()) {
            return;
        }
        window.setTimeout(tryAction, interval);
    }

    window.setTimeout(tryAction, interval);
}

const INPUT_ELEMENTS = ['input', 'textarea', 'button'];
const INPUT_ROLES = ['textbox', 'textarea', 'input', 'button'];

function isFocusedOnInput() {
    const active = document.activeElement;
    if (!active) {
        return false;
    }
    if (INPUT_ELEMENTS.includes(active.tagName.toLowerCase())) {
        return true;
    }
    return INPUT_ROLES.includes(active.getAttribute('role') ?? '');
}

function triggerPageOffset(offset: number) {
    const url = location.href;

    const numbers = url.match(/(\d+)/g);
    if (!numbers) {
        console.log('Tried to trigger page offset, no numbers found');
        return;
    }
    const lastNumber = numbers.slice(-1)[0];
    const index = url.lastIndexOf(lastNumber);
    if (index === -1) {
        console.log(`Unable to find ${lastNumber} in ${url}`);
        return;
    }

    const offsetNumber = (Number(lastNumber) + offset).toString();
    location.href = url.substring(0, index) + offsetNumber + url.substring(index + offsetNumber.length);
}

type KeyMap = { [key: string]: () => void };
const G_KEY_MAP: KeyMap = {
    'g': () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    'e': () => {
        sendMessage(Msg.openExtensions);
    },
    'n': () => {
        triggerPageOffset(1);
    },
    'd': () => {
        triggerPageOffset(-1);
    },
    'D': () => {
        sendMessage(Msg.duplicateTab);
    },
    'h': () => {
        G_KEY_MAP.n();
    },
    'r': () => {
        postActionMessage(Action.openCommandCenter)
    },
    't': () => {
        postActionMessage(Action.openTabCenter)
    },
};

const KEY_MAP: KeyMap = {
    'G': () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    },
    'r': () => {
        window.location.reload();
    },
    'x': () => {
        sendMessage(Msg.closeCurrentTab);
    },
    '<': () => {
        sendMessage({ moveTabOffset: -1 });
    },
    '>': () => {
        sendMessage({ moveTabOffset: 1 });
    }
};

const VIM_KEYS_BLACKLIST = ['google.com'];

function setupVimKeys() {
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

        const DOUBLE_TIME = 350;

        function withinDoubleTime() {
            return Number(new Date()) - LAST_G_TIME <= DOUBLE_TIME;
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

setupVimKeys();

type SiteScript = {
    urls: Urls;
    setup: () => void;
}
const SITE_SCRIPTS: SiteScript[] = [];

function siteScript(urls: Urls, setup: () => void) {
    SITE_SCRIPTS.push({ urls, setup });
}

siteScript('jira.dev.lithium.com', () => {
    // make the popup dialogs actually use all the screen real estate
    const style = document.createElement('style');
    style.textContent = `
        section#create-issue-dialog, section#edit-issue-dialog {
            top: 10px;
            bottom: 10px;
            width: 80%;
        }

        .aui-dialog2-content.jira-dialog-core-content {
            max-height: 100%;
        }
        `;
    document.head.appendChild(style);
});

// function querySelectorEach<ElementType>(selector: string, callback: (element: ElementType) => void) {
//     Array.from(document.querySelectorAll(selector)).forEach(a => a.target = '_blank')
// }
function queryEach<ElementType extends Element>(selector: string, each: (element: ElementType) => void) {
    document.querySelectorAll<ElementType>(selector).forEach(each);
}
function queryEachAnchor(selector: string, each: (element: HTMLAnchorElement) => void) {
    queryEach<HTMLAnchorElement>(selector, each);
}

siteScript('ycombinator.com', () => {
    queryEachAnchor('td.subtext a:not([class]):not([onclick])', a => a.target = '_blank');
    queryEachAnchor('a.titlelink', a => a.target = '_blank');
});

siteScript('reddit.com', () => {
    queryEachAnchor('a.author', a => {
        if (a.href.match(/\/u(ser)?\/[^\/]+$/g)) {
            a.href = a.href + '/submitted/?sort=top&t=all';
        }
    });
    queryEachAnchor('a.subreddit', a => {
        if (a.href.match(/\/r\/[^\/]+$/g)) {
            a.href = a.href + 'top/?sort=top&t=all';
        }
    });
});

siteScript('github.com', () => {
    function retryStatusActions() {
        retryAction(15, 250, () => {
            let foundOne = false;
            queryEachAnchor('a.status-actions', a => {
                a.href = a.href.replace('/display/redirect', '')
                a.target = '_blank';
                foundOne = true;
            });
            return foundOne;
        });
    }

    retryAction(15, 250, () => {
        let foundOne = false;
        queryEachAnchor('.statuses-toggle-closed', a => {
            a.onclick = retryStatusActions;
        });
        return foundOne;
    });
    retryStatusActions();
});

siteScript('meet.google.com', () => {
    retryAction(5, 250, () => {
        let didMute = false;
        const muteButtons = document.querySelectorAll<HTMLButtonElement>('[role="button"][data-is-muted="false"]');
        if (muteButtons.length === 2) {
            muteButtons.forEach((muteButton) => muteButton.click());
            didMute = true;
        }
        return didMute;
    });
});

siteScript(['sdxdemo.com', 'response.lithium.com', 'app.khoros.com'], () => {
    function makeConversationNumberClickable() {
        const conversationNumber = document.querySelector<HTMLDivElement>('[tooltip="Conversation Number"]');
        if (conversationNumber && conversationNumber.textContent && conversationNumber.textContent.length > 1) {
            const caseId = conversationNumber.textContent.slice(1);
            conversationNumber.onclick = () => {
                window.open(`/api/v2/conversations/displayIds/${caseId}`, '_blank');
            }
        }
    }

    setInterval(() => {
        if (urlIncludes('console/agent')) {
            makeConversationNumberClickable();
        }
    }, 2000)
});

SITE_SCRIPTS.forEach(script => {
    if (urlIncludes(script.urls)) {
        script.setup();
    }
});
