function log(...others) {
    console.log('3195', ...others);
}

function urlIncludes(urls) {
    if (!Array.isArray(urls)) {
        urls = [urls];
    }
    return urls.some(url => document.location.href.includes(url));
}

function retryAction(retrySeconds, interval, action) {
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

function sendMessage(message) {
    chrome.runtime.sendMessage(message);
}

const INPUT_ELEMENTS = ['input', 'textarea', 'button'];
const INPUT_ROLES = ['textbox', 'textarea', 'input', 'button'];

function isFocusedOnInput() {
    const active = document.activeElement;
    if (INPUT_ELEMENTS.includes(active.tagName.toLowerCase())) {
        return true;
    }
    return INPUT_ROLES.includes(active.getAttribute('role'));
}

function triggerPageOffset(offset) {
    const url = location.href;

    const numbers = url.match(/(\d+)/g);
    if (!numbers) {
        log('Tried to trigger page offset, no numbers found');
        return;
    }
    const lastNumber = numbers.slice(-1)[0];
    const index = url.lastIndexOf(lastNumber);
    if (index === -1) {
        log(`Unable to find ${lastNumber} in ${url}`);
        return;
    }

    const offsetNumber = (Number(lastNumber) + offset).toString();
    location.href = url.substring(0, index) + offsetNumber + url.substring(index + offsetNumber.length);
}

const G_KEY_MAP = {
    'g': () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    'e': () => {
        sendMessage({ openExtensions: true });
    },
    'n': () => {
        triggerPageOffset(1);
    },
    'd': () => {
        triggerPageOffset(-1);
    },
    'D': () => {
        sendMessage({ directive: 'duplicateTab' });
    },
    'h': () => {
        G_KEY_MAP.n();
    },
    'r': () => {
        window.postMessage({ source: 'commandcenter', action: 'open' });
    },
    't': () => {
        window.postMessage({ source: 'commandcenter', action: 'open-tabcenter' });
    },
};

const KEY_MAP = {
    'G': () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    },
    'r': () => {
        window.location.reload();
    },
    'x': () => {
        sendMessage({ closeCurrentTab: true });
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
        console.log('Clicked key ', key);
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

const SITE_SCRIPTS = [];

function siteScript(urls, setup) {
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

siteScript('ycombinator.com', () => {
    Array.from(document.querySelectorAll('td.subtext a:not([class]):not([onclick])')).forEach(a => a.target = '_blank');
    Array.from(document.querySelectorAll('a.titlelink')).forEach(a => a.target = '_blank');
});

siteScript('reddit.com', () => {
    document.querySelectorAll('a.author').forEach(a => {
        if (a.href.match(/\/u(ser)?\/[^\/]+$/g)) {
            a.href = a.href + '/submitted/?sort=top&t=all';
        }
    });
    document.querySelectorAll('a.subreddit').forEach(a => {
        if (a.href.match(/\/r\/[^\/]+$/g)) {
            a.href = a.href + 'top/?sort=top&t=all';
        }
    });
});

siteScript('github.com', () => {
    function retryStatusActions() {
        retryAction(15, 250, () => {
            let foundOne = false;
            document.querySelectorAll('a.status-actions').forEach(a => {
                a.href = a.href.replace('/display/redirect', '')
                a.target = '_blank';
                foundOne = true;
            });
            return foundOne;
        });
    }

    retryAction(15, 250, () => {
        let foundOne = false;
        document.querySelectorAll('.statuses-toggle-closed').forEach(a => {
            a.onclick = retryStatusActions;
        });
        return foundOne;
    });
    retryStatusActions();
});

siteScript('meet.google.com', () => {
    retryAction(5, 250, () => {
        let didMute = false;
        const muteButtons = document.querySelectorAll('[role="button"][data-is-muted="false"]');
        if (muteButtons.length === 2) {
            muteButtons.forEach((muteButton) => muteButton.click());
            didMute = true;
        }
        return didMute;
    });
});

siteScript(['sdxdemo.com', 'response.lithium.com', 'app.khoros.com'], () => {
    function makeConversationNumberClickable() {
        const conversationNumber = document.querySelector('[tooltip="Conversation Number"]');
        if (conversationNumber && conversationNumber.textContent?.length > 1) {
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
//
// const allEvents = [
//     'Init',
//     'Config',
//     'FirstMessageChatInitiated',
//     'ConversationInitiated',
//     'ChatRulesLoaded',
//     'WidgetConnected',
//     'WidgetOpened',
//     'WidgetClosed',
//     'MessageReceived',
//     'MessageSent',
//     'FrameInitialized',
//     'FrameUpdated',
//     'ClientLoaded',
//     'UnreadCountUpdated',
//     'BlockChatInput',
//     'FormSubmitSuccess',
//     'FormSubmitFail',
//     'FormAuthUserData'
// ];
// allEvents.forEach(event => {
//     window.addEventListener(`khoros${event}`, (e) => {
//         console.log(`khoros${event}: `, e?.detail?.sdk);
//     })
// });
//
