const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const gapi: any;

interface TokenResponse {
    access_token: string
    expires_in: number
    expires_at?: number
}

async function loadScript(url: string) {
    return new Promise((resolve, reject) => {
        const e = document.createElement('script');
        e.src = url;
        e.onload = (ev) => resolve(ev);
        e.onerror = (ev) => reject(ev);
        document.body.appendChild(e);
    });
}


async function getTokenResponseRaw(): Promise<TokenResponse> {
    await loadScript('https://accounts.google.com/gsi/client');
    // https://developers.google.com/identity/oauth2/web/reference/js-reference#google.accounts.oauth2.initTokenClient
    /**
     * popupを表示せずにaccess tokenを更新するのは無理っぽい
     * https://stackoverflow.com/questions/72080698/refresh-google-oauth2-token-automatically
     */
    return await new Promise((resolve, _reject) => {
        const client = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            prompt: '',
            hint: 'shosatojp2001@gmail.com',
            callback: (tokenResponse: TokenResponse) => {
                resolve(tokenResponse);
            },
        });
        client.requestAccessToken({ prompt: '' });
    });
}

async function getTokenResponse(): Promise<TokenResponse> {
    const KEY = 'token';
    const tokenResponseStored: TokenResponse | null = (() => {
        const obj = localStorage.getItem(KEY);
        if (!obj)
            return null;

        try {
            return JSON.parse(obj) as TokenResponse;
        } catch (error) {
            return null;
        }
    })();

    const tokenResponse: TokenResponse = await (async () => {
        if (tokenResponseStored
            && tokenResponseStored.expires_at
            && tokenResponseStored.expires_at > new Date().getTime() / 1000) {
            return tokenResponseStored;
        } else {
            const tokenResponse = await getTokenResponseRaw();
            tokenResponse.expires_at = tokenResponse.expires_in + new Date().getTime() / 1000;
            localStorage.setItem(KEY, JSON.stringify(tokenResponse));
            return tokenResponse;
        }
    })();

    return tokenResponse;
}

async function initGoogleAPIClient() {
    await loadScript('https://apis.google.com/js/api.js');
    return new Promise((resolve, _reject) => {
        gapi.load('client', async () => {
            await gapi.client.init({});
            resolve(true);
        });
    });
}

let gapiInitialized = false;

export async function gdriveAuth() {
    const tokenResponse = await getTokenResponse();

    if (!gapiInitialized) {
        await initGoogleAPIClient();
        gapiInitialized = true;
    }

    gapi.client.setToken(tokenResponse);
}

async function gdriveFindFile(name: string) {
    const res = await gapi.client.request({
        path: '/drive/v3/files',
        method: 'GET',
        params: {
            q: `name = '${name}' and trashed = false`,
            fields: 'files(id, modifiedTime)',
        },
    });
    if (res.status !== 200) {
        throw new Error(`failed to find file: ${name}`);
    }

    return res.result.files[0];
}

async function gdriveCreateFile(name: string) {
    const res = await gapi.client.request({
        path: '/drive/v3/files',
        method: 'POST',
        body: { name },
    });
    if (res.status !== 200) {
        throw new Error(`failed to create file: ${name}`);
    }

    return res.result;
}

async function gdriveUploadContent(id: string, content: string) {
    const res = await gapi.client.request({
        path: `/upload/drive/v3/files/${id}`,
        method: 'PATCH',
        params: {
            uploadType: 'media',
        },
        body: content,
    });
    if (res.status !== 200) {
        throw new Error(`failed to upload content: ${id}`);
    }

    return res.result;
}

async function gdriveGetContent(id: string) {
    const res = await gapi.client.request({
        path: `/drive/v3/files/${id}`,
        method: 'GET',
        params: {
            alt: 'media',
        },
    });
    if (res.status !== 200) {
        throw new Error(`failed to get content: ${id}`);
    }

    return res.body;
}

export type GoogleDriveSyncResult = {
    operation: 'upload'
    remoteModifiedDate: Date
} | {
    operation: 'download'
    content: string
    remoteModifiedDate: Date
} | {
    operation: 'nothing'
};

export async function gdriveSync(name: string, content: string, localModifiedDate: Date | null): Promise<GoogleDriveSyncResult> {
    const file = await gdriveFindFile(name);
    if (file) {
        const remoteModifiedDate = new Date(file.modifiedTime);

        if (localModifiedDate === null || remoteModifiedDate > localModifiedDate) {
            /* download */
            console.debug('download');
            const content = await gdriveGetContent(file.id);
            return { operation: 'download', content, remoteModifiedDate };
        } else if (localModifiedDate > remoteModifiedDate) {
            /* upload */
            console.debug('upload');
            await gdriveUploadContent(file.id, content);
            const fileModified = await gdriveFindFile(name);
            return { operation: 'upload', remoteModifiedDate: new Date(fileModified.modifiedTime) };
        } else {
            /* do nothing */
            console.debug('do nothing');
            return { operation: 'nothing' };
        }

    } else {
        /* create file if not exists */
        console.debug('create file');
        const file = await gdriveCreateFile(name);
        await gdriveUploadContent(file.id, content);
        const fileModified = await gdriveFindFile(name);
        return { operation: 'upload', remoteModifiedDate: new Date(fileModified.modifiedTime) };
    }
}
