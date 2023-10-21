export type IStorage = {
    githubUsername: string;
    gDoubleTime: number;
    vimKeysBlacklistCSV: string;
};

const defaultStorage: IStorage = {
    githubUsername: 'williamconnolly',
    gDoubleTime: 350,
    vimKeysBlacklistCSV: 'google.com',
};

export const storage = {
    get: (): Promise<IStorage> =>
        chrome.storage.sync.get(defaultStorage) as Promise<IStorage>,
    set: (value: IStorage): Promise<void> => chrome.storage.sync.set(value),
};
