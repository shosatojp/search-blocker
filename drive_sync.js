var DriveSync = DriveSync || (function () {
    const DriveSync = function (client_id, filename) {
        this.CLIENT_ID = client_id;
        this.FILE_NAME = filename;
    };

    class RequestError extends Error {
        constructor(e) {
            this.status = e.status;
        }
    }

    async function request(e) {
        try {
            return await gapi.client.request(e);
        } catch (error) {
            throw new RequestError();
        }
    }

    DriveSync.prototype.authenticate = function () {
        return gapi.auth2.getAuthInstance()
            .signIn({
                scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file"
            });
    }

    async function createFile(name) {
        return (await request({
            path: '/drive/v3/files',
            method: 'POST',
            body: {
                name: name
            }
        })).result;
    }

    async function findFile(name) {
        return (await request({
            path: '/drive/v3/files',
            method: 'GET',
            params: {
                q: `name = '${name}' and trashed = false`,
                fields: 'files(id, modifiedTime)'
            }
        })).result.files[0];
    }

    async function updateFileContent(id, content) {
        return (await request({
            path: `/upload/drive/v3/files/${id}`,
            method: 'PATCH',
            params: {
                uploadType: 'media'
            },
            body: content
        })).result;
    }

    async function getFileContent(id) {
        return (await request({
            path: `/drive/v3/files/${id}`,
            method: 'GET',
            params: {
                alt: 'media'
            }
        })).body;
    }

    DriveSync.prototype.updateListFile = async function (localModifiedTime, onDownload, getData) {
        var file;
        if (!(file = await findFile(this.FILE_NAME))) {
            file = await createFile(this.FILE_NAME);
        }

        if (file) {
            if (localModifiedTime < new Date(file.modifiedTime).getTime()) {
                onDownload(await getFileContent(file.id)); //ondownloadで今の時間を保存する。
            } else {
                await updateFileContent(file.id, getData());
            }
        } else {
            console.error('cannot sync file');
        }
    }

    DriveSync.prototype.signIn = function (onsignin) {
        return new Promise((res, rej) => {
            if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
                console.log('already signed in');
                onsignin && onsignin();
                res();
            } else {
                this.authenticate().then(() => {
                    console.log('signed in');
                    onsignin && onsignin();
                    res();
                }, () => {
                    console.log('signed in failed');
                    rej();
                });
            }
        });
    }

    DriveSync.prototype.initSync = function (onsignin, onsignout) {
        const self = this;
        return new Promise(((res, rej) => {
            if (!('gapi' in window)) {
                const script = document.createElement('script');
                script.setAttribute('src', 'https://apis.google.com/js/api.js');
                document.body.appendChild(script);
                script.addEventListener('load', () => {
                    gapi.load("client:auth2", async function () {
                        await gapi.auth2.init({
                            client_id: CLIENT_ID
                        });
                        gapi.auth2.getAuthInstance().isSignedIn.listen(e => {
                            if (e) {
                                onsignin && onsignin();
                            } else {
                                onsignout && onsignout();
                            }
                        });
                        self.signIn(onsignin).then(res, rej);
                    });
                });
            } else {
                self.signIn().then(res, rej);
            }
        }));
    }

    DriveSync.prototype.signOut = function () {
        gapi.auth2.getAuthInstance().signOut();
    }

    return DriveSync;
})();

class TamperDriveSync extends DriveSync{
    constructor(client_id,filename){
        super(client_id,filename);
    }
    
}

// var TamperDriveSync = TamperDriveSync || (function () {
//     const TamperDriveSync = function () {

//     };


//     return TamperDriveSync;
// })();