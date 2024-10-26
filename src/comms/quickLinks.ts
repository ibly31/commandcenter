import { type BookmarkTreeNode, faviconUrl, getRootBookmarks } from './commands';

export type QuickLinksNode = {
    key: string;
    title: string;
    url?: string;
    favIconUrl?: string;
    children?: QuickLinksTree;
};

export type QuickLinksTree = Record<string, QuickLinksNode>;

export type QuickLinksMessageResponse = {
    quickLinks?: QuickLinksTree;
}

const JENKINS_KEY_MAP = {
    p: 'proactive-chat-widget - ',
    m: 'messaging-auth-handler - ',
    c: 'change-log-handler - ',
    i: 'ic-backend-'
};

const SUB_KEY_MAP = {
    r: 'Create Release',
    q: 'Deploy to QA',
    d: 'Deploy to QA',
    s: 'Deploy to Stage',
    p: 'Deploy to Prod'
}

// 1. Some special character or naming scheme to specify a quick key
// 2. Figure out why jenkins is flattened

function reduceBookmark(bm: BookmarkTreeNode): QuickLinksNode {
    const key = bm.title.at(0)!.toLowerCase();

    if (!bm.children) {
        return {
            key,
            url: bm.url!,
            title: bm.title,
            favIconUrl: faviconUrl(bm.url)
        }
    }
    const bmChildren: QuickLinksTree = bm.children.reduce((qlt: QuickLinksTree, { children, ...rest }) => {
        const node = reduceBookmark(rest);
        qlt[node.key] = node;
        return qlt;
    }, {});

    return {
        key,
        title: bm.title,
        children: bmChildren
    };
}

function bookmarksToQuickLinksTree(rootBookmarks: BookmarkTreeNode[]): QuickLinksTree {
    return rootBookmarks
        .map(reduceBookmark)
        .reduce((qlt: QuickLinksTree, node) => {
            qlt[node.key] = node;
            return qlt;
        }, {}) ?? {};
}

export async function loadQuickLinks(): Promise<QuickLinksTree> {
    return bookmarksToQuickLinksTree(await getRootBookmarks());
}
