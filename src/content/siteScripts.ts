import { type ContentUrls, queryEachAnchor, retryAction, urlIncludes } from './utils';
import { LOCAL_SITE_SCRIPTS } from './local';

export type SiteScript = {
    urls: ContentUrls;
    description: string;
    setup: () => void;
}
export const SITE_SCRIPTS: SiteScript[] = [];

export function siteScript(urls: ContentUrls, description: string, setup: () => void) {
    return { urls, description, setup };
}

function addSiteScript(urls: ContentUrls, description: string, setup: () => void) {
    SITE_SCRIPTS.push(siteScript(urls, description, setup));
}

addSiteScript('jira.dev.lithium.com', 'Jira', () => {
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


addSiteScript('ycombinator.com', 'HackerNews', () => {
    queryEachAnchor('td.subtext a:not([class]):not([onclick])', a => a.target = '_blank');
    queryEachAnchor('a.titlelink', a => a.target = '_blank');
});

addSiteScript('reddit.com', 'Reddit', () => {
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

addSiteScript('github.com', 'GitHub', () => {
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

addSiteScript('meet.google.com', 'Google Meet', () => {
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

addSiteScript(['sdxdemo.com', 'response.lithium.com', 'app.khoros.com'], 'Care', () => {
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

export function setupSiteScripts() {
    [...SITE_SCRIPTS, ...LOCAL_SITE_SCRIPTS].forEach(script => {
        if (urlIncludes(script.urls)) {
            script.setup();
        }
    });
}
