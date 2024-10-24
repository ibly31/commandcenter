import { type ContentUrls, queryEachAnchor, retryAction, urlIncludes } from './utils';
import type { HTMLImgAttributes } from 'svelte/elements';

type SiteScript = {
    urls: ContentUrls;
    description: string;
    setup: () => void;
}
export const SITE_SCRIPTS: SiteScript[] = [];

function siteScript(urls: ContentUrls, description: string, setup: () => void) {
    SITE_SCRIPTS.push({ urls, description, setup });
}

siteScript('jira.dev.lithium.com', 'Jira', () => {
    // make the popup dialogs actually use all the screen real estate
    const style = document.createElement('style');
    style.id = 'commandcenter-jira';
    style.textContent = `
        section#create-issue-dialog, section#edit-issue-dialog {
            top: 10px;
            bottom: 10px;
            width: 80%;
        }
        
        .jira-dialog.popup-width-large {
            width: 80% !important;
        }

        .aui-dialog2-content.jira-dialog-core-content {
            max-height: 100%;
        }
        
        .tox .tox-edit-area__iframe[title="Rich Text Area"] {
            /*padding: 0 7px !important;*/
        }
        `;
    document.head.appendChild(style);
});


siteScript('ycombinator.com', 'HackerNews', () => {
    queryEachAnchor('td.subtext a:not([class]):not([onclick])', a => a.target = '_blank');
    queryEachAnchor('a.titlelink', a => a.target = '_blank');
});

siteScript('reddit.com', 'Reddit', () => {
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

siteScript('github.com', 'GitHub', () => {
    function retryStatusActions() {
        retryAction(100, 500, () => {
            let foundOne = false;
            queryEachAnchor('a.status-actions', a => {
                a.href = a.href.replace('/display/redirect', '')
                a.target = '_blank';
                foundOne = true;
            });
            return foundOne;
        });
    }

    retryAction(100, 500, () => {
        let foundOne = false;
        queryEachAnchor('.statuses-toggle-closed', a => {
            a.onclick = retryStatusActions;
        });
        return foundOne;
    });
    retryStatusActions();
});

siteScript('meet.google.com', 'Google Meet', () => {
    retryAction(15, 100, () => {
        let didMute = false;
        const muteButtons = document.querySelectorAll<HTMLButtonElement>('[role="button"][data-is-muted="false"]');
        if (muteButtons.length === 2) {
            muteButtons.forEach((muteButton) => muteButton.click());
            didMute = true;
        }
        return didMute;
    });
});

siteScript('awsapps.com', 'AWS SSO', () => {
    retryAction(5, 100, () => {
        const portalApplication = document.querySelector<HTMLDivElement>('portal-application');
        if (portalApplication) {
            portalApplication.click();

            retryAction(3, 20, () => {
                const expandIcons = document.querySelectorAll<HTMLImageElement>('.expandIcon');
                if (expandIcons?.length) {
                    expandIcons.forEach(ei => ei.click());
                    return true;
                }
                return false;
            });
            return true;
        }
        return false;
    });
});

siteScript(['sdxdemo.com', 'response.lithium.com', 'app.khoros.com'], 'Care', () => {
    if (urlIncludes('/account/login') && !urlIncludes('manual-c01')) {
        window.location.href = window.location.href.replace('/account/login', '/khoros/login');
        return;
    }

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
    SITE_SCRIPTS.forEach(script => {
        if (urlIncludes(script.urls)) {
            script.setup();
        }
    });
}
