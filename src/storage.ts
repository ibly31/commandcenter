export type IStorage = {
    githubUsername: string;
};

// TODO reset to empty string
const defaultStorage: IStorage = {
    githubUsername: 'williamconnolly',
};

export const storage = {
    get: (): Promise<IStorage> =>
        chrome.storage.sync.get(defaultStorage) as Promise<IStorage>,
    set: (value: IStorage): Promise<void> => chrome.storage.sync.set(value),
};
