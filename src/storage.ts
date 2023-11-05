export type IStorage = {
    githubUsername: string;
    githubApiToken: string;
    gDoubleTime: number;
    vimKeysBlacklistCSV: string;
    scrollSmooth: boolean;
};

const defaultStorage: IStorage = {
    githubUsername: import.meta.env.VITE_GITHUB_USERNAME || '',
    githubApiToken: import.meta.env.VITE_GITHUB_API_TOKEN || '',
    gDoubleTime: 350,
    vimKeysBlacklistCSV: 'google.com, gmail.com',
    scrollSmooth: true,
};

export async function resetStorage() {
    await storage.set({ ...defaultStorage });
}

export const storage = {
    get: (): Promise<IStorage> =>
        chrome.storage.sync.get(defaultStorage) as Promise<IStorage>,
    set: (value: IStorage): Promise<void> => chrome.storage.sync.set(value),
};
