import { setupSiteScripts } from './siteScripts';
import { setupVimKeys } from './vimKeys';
import { storage } from '../storage';

setupSiteScripts();

storage.get().then(({ gDoubleTime, vimKeysBlacklistCSV }) => {
    let vimKeysBlacklist: string[] = [];
    try {
        // if misconfigured we will just have no blacklist
        vimKeysBlacklist = vimKeysBlacklistCSV?.split(',') || [];
        vimKeysBlacklist = vimKeysBlacklist.map(bl => bl.trim()).filter(bl => bl?.length > 0);
    } finally {
        setupVimKeys(gDoubleTime || 350, vimKeysBlacklist || []);
    }
});
