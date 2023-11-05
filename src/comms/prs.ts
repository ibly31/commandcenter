export type PR = {
    id: number;
    url: string;
    org: string;
    repo: string;
    title: string;
    lastVisitTime: number;
    visitCount: number;

    // ${repo}: ${title}
    searchEntry: string;
};

export type PRMessageResponse = {
    prs: PR[];
}

const urlRe = /^(?<url>https:\/\/github.com\/(?<org>\w+)\/(?<repo>[\w-]+)\/pull\/(?<id>\d+))/;
const titleRe = /^(?<title>.+?) ·/;

function makePR(item: chrome.history.HistoryItem): PR | null {
    const urlMatch = item.url?.match(urlRe);
    if (!urlMatch?.groups) {
        return null;
    }
    const { id, org, repo, url } = urlMatch.groups;

    const titleMatch = item.title?.match(titleRe);
    const title = titleMatch?.groups?.title;
    if (!title) {
        return null;
    }
    return {
        id: Number(id),
        url,
        org,
        repo,
        title,
        lastVisitTime: item.lastVisitTime!,
        visitCount: item.visitCount!,
        searchEntry: `${repo}: ${title}`
    };
}

const maxPRs = 50;
const maxSearchResults = 1000;

let millisPerWeek = 1000 * 60 * 60 * 24 * 7;
function getStartTime(weeks: number) {
    return new Date().getTime() - weeks * millisPerWeek;
}

export async function getPRs(githubUsername: string): Promise<PR[]> {
    const items = await chrome.history.search({
        startTime: getStartTime(4),
        text: `github.com pull request by ${githubUsername}`,
        maxResults: maxSearchResults
    });
    const seenCompositeIds: Set<string> = new Set();
    return items
        .map(makePR)
        .filter(pr => pr !== null)
        .map(pr => pr!)
        .filter(pr => {
            const { org, repo, id } = pr;
            const compositeId = `${org}/${repo}/${id}`;
            if (seenCompositeIds.has(compositeId)) {
                return false;
            }
            seenCompositeIds.add(compositeId);
            return true;
        })
        .sort((a, b) => a.lastVisitTime - b.lastVisitTime)
        .slice(0, maxPRs);
}
