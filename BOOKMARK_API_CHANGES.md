# Chrome Bookmark API Changes Implementation

## Overview

This extension has been updated to handle Chrome's upcoming bookmark sync changes as detailed in the [Chrome Developer Blog](https://developer.chrome.com/blog/bookmarks-sync-changes).

## Key Changes

### 1. Dual Storage System
Chrome is introducing a dual storage system where users can have both syncing and non-syncing bookmarks simultaneously. This means there can be multiple instances of the same folder type (e.g., two "Bookmarks bar" folders).

### 2. New API Properties
- `folderType`: Identifies special folders ('bookmarks-bar', 'other', 'mobile')
- `syncing`: Boolean indicating whether the bookmark is synced to the user's Google Account

### 3. Implementation Details

#### Updated Functions

**`getRootBookmarks()`**
- Now searches for all bookmarks bar folders across the entire tree
- Uses `folderType` property when available, falls back to flexible title matching for backward compatibility
- Supports multiple languages (English, Spanish, French) and variations in bookmark folder names
- Includes fallback mechanism for browsers with different bookmark structures
- Combines bookmarks from all found bookmarks bar folders

**`bookmarksToCommands()`**
- Adds visual indicators for syncing status: `[Local]` for non-syncing, `[Synced]` for syncing bookmarks
- Only shows indicators when the `syncing` property is explicitly available (prevents false positives)
- Maintains backward compatibility with existing Chrome versions and other browsers

**New Utility Functions**
- `getAllBookmarks()`: Gets all bookmarks for debugging purposes with robust error handling
- `hasNewBookmarkAPI()`: Detects if the new API features are available with detailed logging

#### Type Definitions

Added `ExtendedBookmarkTreeNode` interface to include the new properties:
```typescript
export interface ExtendedBookmarkTreeNode extends BookmarkTreeNode {
    folderType?: 'bookmarks-bar' | 'other' | 'mobile';
    syncing?: boolean;
}
```

## Backward Compatibility

### Enhanced Compatibility Features

1. **Flexible Title Matching**: Supports various bookmark folder names and languages
2. **Fallback Mechanisms**: Multiple strategies to find bookmarks when primary methods fail
3. **Conservative Property Detection**: Only uses new API features when explicitly available
4. **Robust Error Handling**: Graceful degradation when API calls fail
5. **Brave Browser Support**: Specifically tested and optimized for Brave Browser compatibility

### Supported Browsers

- ✅ Chrome (current and future versions)
- ✅ Brave Browser (current versions)
- ✅ Other Chromium-based browsers
- ✅ Edge (Chromium-based)

## Testing

### Manual Testing
1. **For Chrome Canary**: Enable the new API (version 138.0.7196.0 or later)
2. **For Brave Browser**: Use current stable version (no flags needed)
3. Use the test function: `testBookmarkAPI()` in the browser console

### Chrome Flags for Testing (Chrome Canary only)
Enable these flags in `chrome://flags`:
- `sync-enable-bookmarks-in-transport-mode`
- `enable-bookmarks-selected-type-on-signin-for-testing`

### Test Output
The test function provides detailed information about:
- Browser detection
- API availability
- Bookmark counts
- Property detection
- Error handling

## Timeline

- **June 2025**: Changes start rolling out to Chrome Stable users
- **Gradual rollout**: Small percentage initially, then wider distribution
- **Backward compatibility**: Extension will work with both old and new APIs

## Migration Notes

- The extension maintains full backward compatibility
- No user action required - the extension will automatically detect and use new API features when available
- Visual indicators will help users distinguish between local and synced bookmarks
- Works seamlessly with Brave Browser and other Chromium-based browsers

## Files Modified

- `src/comms/commands.ts`: Main implementation of the new bookmark handling with enhanced backward compatibility
- `src/test-bookmark-api.ts`: Testing utilities with improved error handling and browser detection
- `BOOKMARK_API_CHANGES.md`: This documentation file 