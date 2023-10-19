export type PR = {
    id: number;
    url: string;
    org: string;
    repo: string;
    title: string;
    lastVisitTime: number;
    visitCount: number;
};

export type PRMessageResponse = {
    prs: PR[];
}

const urlRe = /^https:\/\/github.com\/(?<org>\w+)\/(?<repo>[\w-]+)\/pull\/(?<id>\d+)/;
const titleRe = /^(?<title>.+?) ·/;
export function makePR(item: chrome.history.HistoryItem): PR | null {
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
        visitCount: item.visitCount!
    };
}

export async function getPRs(): Promise<PR[]> {
    const items = await chrome.history.search({
        startTime: 0,
        text: 'github.com pull',
        maxResults: 1000
    });
    return items
        .map(makePR)
        .filter(pr => pr !== null)
        .map(pr => pr!);
}
