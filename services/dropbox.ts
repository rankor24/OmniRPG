
import type { BackupDataParts } from './dataManager';

const FILES = {
    CHATS: '/OmniAI_Sync_Chats.json',
    CHARACTERS: '/OmniAI_Sync_Characters.json',
    MEMORIES: '/OmniAI_Sync_Memories.json',
    LOREBOOKS: '/OmniAI_Sync_Lorebooks.json',
    SYSTEM: '/OmniAI_Sync_System.json',
    IMAGES: '/OmniAI_Sync_Images.json',
    LEGACY_DATA: '/OmniAI_Sync_Data.json'
};

interface DropboxCredentials {
    appKey: string;
    appSecret: string;
    refreshToken: string;
}

// Store the current access token in memory
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number | null = null;

const sanitize = (str: string) => {
    if (!str) return '';
    // Removes whitespace, newlines, and common invisible characters (zero-width spaces)
    return str.trim().replace(/[\u200B-\u200D\uFEFF\n\r\t]/g, '');
};

const getAccessToken = async (creds: DropboxCredentials): Promise<string> => {
    // Aggressive sanitization to prevent "Malformed Token" errors
    const appKey = sanitize(creds.appKey);
    const appSecret = sanitize(creds.appSecret);
    const refreshToken = sanitize(creds.refreshToken);

    if (!appKey || !appSecret || !refreshToken) {
        throw new Error("Dropbox credentials are not configured. Please add them in Settings > Data > Cloud Sync.");
    }

    if (cachedAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 300000) {
        return cachedAccessToken;
    }
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: appKey,
            client_secret: appSecret,
        }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token Refresh Error: ${errorData.error_description || errorData.error || 'Unknown error'}`);
    }
    const data = await response.json();
    cachedAccessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in * 1000);
    return cachedAccessToken;
};

const uploadFile = async (filePath: string, data: string, creds: DropboxCredentials): Promise<void> => {
    const accessToken = await getAccessToken(creds);
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({ path: filePath, mode: 'overwrite', mute: true }),
        },
        body: data,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Dropbox Upload Error (${filePath}): ${errorData.error_summary || 'Unknown error'}`);
    }
};

const downloadFile = async (filePath: string, creds: DropboxCredentials): Promise<string> => {
    const accessToken = await getAccessToken(creds);
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Dropbox-API-Arg': JSON.stringify({ path: filePath }),
        },
    });
    if (!response.ok) {
        if (response.status === 409) return "{}"; // File not found, return empty object
        let errorSummary = 'Unknown error';
        try {
            const errorData = await response.json();
            errorSummary = errorData.error_summary || JSON.stringify(errorData);
        } catch (e) {
            errorSummary = await response.text();
        }
        throw new Error(`Dropbox Download Error (${filePath}): ${errorSummary}`);
    }
    return await response.text();
};

const getFileMetadata = async (filePath: string, creds: DropboxCredentials): Promise<{ server_modified: string } | null> => {
    const accessToken = await getAccessToken(creds);
    const response = await fetch('https://api.dropboxapi.com/2/files/get_metadata', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
    });
    if (response.status === 409) return null; // Not found
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Dropbox Metadata Error (${filePath}): ${errorData.error_summary || 'Unknown error'}`);
    }
    const metadata = await response.json();
    return { server_modified: metadata.server_modified };
};

export const uploadBackupToDropbox = async (
    dataParts: BackupDataParts, 
    creds: DropboxCredentials,
    onProgress?: (msg: string, progress: number) => void
): Promise<void> => {
    const tasks = [
        { path: FILES.CHATS, data: dataParts.chats, name: 'Chats' },
        { path: FILES.CHARACTERS, data: dataParts.characters, name: 'Characters' },
        { path: FILES.MEMORIES, data: dataParts.memories, name: 'Memories' },
        { path: FILES.LOREBOOKS, data: dataParts.lorebooks, name: 'Lorebooks' },
        { path: FILES.SYSTEM, data: dataParts.system, name: 'System Settings' },
    ];
    
    if (dataParts.images) {
        tasks.push({ path: FILES.IMAGES, data: dataParts.images, name: 'Images' });
    }

    const total = tasks.length;
    
    // Upload sequentially to allow for clear progress reporting
    for (let i = 0; i < total; i++) {
        const task = tasks[i];
        // Calculate percentage: current index / total count
        const percent = Math.round((i / total) * 100);
        
        if (onProgress) onProgress(`Uploading ${task.name}...`, percent);
        await uploadFile(task.path, task.data, creds);
    }
    
    if (onProgress) onProgress('Finalizing upload...', 100);
};

export const downloadBackupFromDropbox = async (creds: DropboxCredentials): Promise<{ textData: string; imageData: string; }> => {
    // Try to download the System file first to detect if we are using the new format
    const systemJson = await downloadFile(FILES.SYSTEM, creds);

    // If System file is empty/missing, fallback to legacy monolithic data file
    if (systemJson === '{}') {
        console.log("New format not found, attempting legacy download...");
        const oldData = await downloadFile(FILES.LEGACY_DATA, creds);
        if (oldData === '{}') {
             return { textData: "{}", imageData: "{}" }; // Nothing found
        }
        const oldImages = await downloadFile(FILES.IMAGES, creds);
        return { textData: oldData, imageData: oldImages };
    }

    // If System file exists, download the rest of the split files
    const [chats, chars, mems, lores, imgs] = await Promise.all([
        downloadFile(FILES.CHATS, creds),
        downloadFile(FILES.CHARACTERS, creds),
        downloadFile(FILES.MEMORIES, creds),
        downloadFile(FILES.LOREBOOKS, creds),
        downloadFile(FILES.IMAGES, creds),
    ]);

    // Merge text parts back into one structure for importBackupData
    const merged = { localStorage: {}, indexedDB: {} };
    const parts = [chats, chars, mems, lores, systemJson].map(p => JSON.parse(p));

    parts.forEach(part => {
        if (part.localStorage) Object.assign(merged.localStorage, part.localStorage);
        if (part.indexedDB) Object.assign(merged.indexedDB, part.indexedDB);
    });

    return { textData: JSON.stringify(merged), imageData: imgs };
};

export const getDropboxMetadata = async (creds: DropboxCredentials): Promise<{ server_modified: string } | null> => {
    // We use the System file as the primary indicator of the last sync time for the new format.
    const systemMeta = await getFileMetadata(FILES.SYSTEM, creds);
    
    // If System file exists, return its metadata
    if (systemMeta) return systemMeta;

    // Fallback: Check for legacy data file
    return await getFileMetadata(FILES.LEGACY_DATA, creds);
};
