// Test file for bookmark API changes
// Run this in the browser console to test the new functionality

import { getRootBookmarks, getAllBookmarks, hasNewBookmarkAPI, loadBookmarkCommands } from './comms/commands';

export async function testBookmarkAPI() {
    console.log('Testing Bookmark API Changes...');
    console.log('Browser:', navigator.userAgent);
    
    try {
        // Test 1: Check if new API is available
        const hasNewAPI = await hasNewBookmarkAPI();
        console.log('New API available:', hasNewAPI);
        
        if (!hasNewAPI) {
            console.log('Note: This is expected for Brave Browser and other browsers that haven\'t implemented the new API yet.');
        }
        
        // Test 2: Get all bookmarks for debugging
        const allBookmarks = await getAllBookmarks();
        console.log('All bookmarks count:', allBookmarks.length);
        
        if (allBookmarks.length > 0) {
            console.log('Sample bookmark structure:', Object.keys(allBookmarks[0]));
        }
        
        // Test 3: Get root bookmarks (bookmarks bar)
        const rootBookmarks = await getRootBookmarks();
        console.log('Root bookmarks count:', rootBookmarks.length);
        
        // Test 4: Load bookmark commands
        const bookmarkCommands = await loadBookmarkCommands();
        console.log('Bookmark commands count:', bookmarkCommands.length);
        
        // Test 5: Check for new properties
        const bookmarksWithNewProps = allBookmarks.filter(bm => 
            'folderType' in bm || 'syncing' in bm
        );
        console.log('Bookmarks with new properties:', bookmarksWithNewProps.length);
        
        // Test 6: Check for specific properties
        const bookmarksWithFolderType = allBookmarks.filter(bm => 'folderType' in bm);
        const bookmarksWithSyncing = allBookmarks.filter(bm => 'syncing' in bm);
        
        console.log('Bookmarks with folderType:', bookmarksWithFolderType.length);
        console.log('Bookmarks with syncing:', bookmarksWithSyncing.length);
        
        return {
            hasNewAPI,
            totalBookmarks: allBookmarks.length,
            rootBookmarksCount: rootBookmarks.length,
            bookmarkCommandsCount: bookmarkCommands.length,
            bookmarksWithNewProps: bookmarksWithNewProps.length,
            bookmarksWithFolderType: bookmarksWithFolderType.length,
            bookmarksWithSyncing: bookmarksWithSyncing.length,
            browser: navigator.userAgent
        };
    } catch (error) {
        console.error('Error during bookmark API test:', error);
        return {
            error: error instanceof Error ? error.message : String(error),
            browser: navigator.userAgent
        };
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    (window as any).testBookmarkAPI = testBookmarkAPI;
} 