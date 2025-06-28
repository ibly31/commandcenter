export type IStorage = {
    githubUsername: string;
    gDoubleTime: number;
    vimKeysBlacklistCSV: string;
    scrollSmooth: boolean;
    newTabBackgroundColor: string;
    redditThumbnailSizeIncrement: number;
};

const defaultStorage: IStorage = {
    githubUsername: import.meta.env.VITE_GITHUB_USERNAME || '',
    gDoubleTime: 350,
    vimKeysBlacklistCSV: 'google.com, gmail.com',
    scrollSmooth: true,
    newTabBackgroundColor: '#202124', // $kh-black value
    redditThumbnailSizeIncrement: 5,
};

export async function resetStorage() {
    await storage.set({ ...defaultStorage });
}

export const storage = {
    get: (): Promise<IStorage> =>
        chrome.storage.sync.get(defaultStorage) as Promise<IStorage>,
    set: (value: IStorage): Promise<void> => chrome.storage.sync.set(value),
};
