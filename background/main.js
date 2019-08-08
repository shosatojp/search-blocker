chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request);
    switch (request.method) {
        case 'initSync':
            initSync().then(() => {
                sendResponse(true);
            });
            break;

        default:
            break;
    }
});

//client id of this application.
const CLIENT_ID = '531665009269-96fvecl3pj4717mj2e6if6oaph7eu8ar.apps.googleusercontent.com';
//name of block list file in google drive.
const LIST_FILE_NAME = 'GoogleSearchBlocker.txt';

function initSync() {
    return new Promise(((res, rej) => {
        if (!('gapi' in window)) {
            const script = document.createElement('script');
            script.setAttribute('src', 'https://apis.google.com/js/api.js');
            document.body.appendChild(script);
            script.addEventListener('load', () => {
                gapi.load("client:auth2", async function () {
                    gapi.auth2.init({
                        client_id: CLIENT_ID
                    }).then(() => {
                        self.signIn().then(res, rej);
                    }).catch((e) => {
                        console.log(e);
                        rej();
                    });
                });
            });
            script.addEventListener('error', function () {
                rej();
            });
        } else {
            self.signIn().then(res, rej);
        }
    }));
}