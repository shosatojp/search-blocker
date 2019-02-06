// ==UserScript==
// @name         Google Search Blocker (Sync Beta)
// @namespace    https://github.com/ShoSatoJp/sync
// @version      0.9.36
// @description  block undesired sites from google search results!
// @author       ShoSato
// @match https://www.google.co.jp/search?*
// @match https://www.google.com/search?*
// @match https://www.bing.com/*
// @match https://search.yahoo.co.jp/*
// @resource label https://github.com/shosatojp/google_search_blocker/raw/sync/container.html?
// @resource buttons https://github.com/shosatojp/google_search_blocker/raw/sync/buttons.html?
// @resource selectors https://github.com/shosatojp/google_search_blocker/raw/sync/selectors.html?
// @resource environments https://github.com/shosatojp/google_search_blocker/raw/sync/environments.json?
// @resource languages https://github.com/shosatojp/google_search_blocker/raw/sync/languages.json?
// @resource drive_sync https://github.com/shosatojp/google_search_blocker/raw/sync/drive_sync.js?
// @updateURL https://github.com/shosatojp/google_search_blocker/raw/sync/google_search_blocker.user.js?
// @downloadURL 	https://github.com/shosatojp/google_search_blocker/raw/sync/google_search_blocker.user.js?
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_getResourceText
// ==/UserScript==

(function () {
    'use strict';
    const DriveSync = (function () {
        const DriveSync = function (client_id, filename, setModifiedTime, getModifiedTime, defaultOnDownload, defaultGetData) {
            this.CLIENT_ID = client_id;
            this.FILE_NAME = filename;
            this.setModifiedTime = setModifiedTime;
            this.getModifiedTime = getModifiedTime;
            this.defaultOnDownload = defaultOnDownload;
            this.defaultGetData = defaultGetData;
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

        DriveSync.prototype.compare = async function (presetModifiedTime = false, onDownload, getData) {
            onDownload = onDownload || this.defaultOnDownload;
            getData = getData || this.defaultGetData;
            if (presetModifiedTime) {
                this.setModifiedTime(Date.now());
            }
            var file;
            if (!(file = await findFile(this.FILE_NAME))) {
                file = await createFile(this.FILE_NAME);
            }

            if (file) {
                const serverModifiedTime = new Date(file.modifiedTime).getTime();
                const localModifiedTime = this.getModifiedTime();
                console.log('server:', serverModifiedTime, ' local:', localModifiedTime);
                if (localModifiedTime < serverModifiedTime) {
                    onDownload(await getFileContent(file.id), serverModifiedTime); //ondownloadで今の時間を保存する。
                    this.setModifiedTime(serverModifiedTime);
                } else if (localModifiedTime > serverModifiedTime) {
                    await updateFileContent(file.id, getData());
                } else {
                    console.log('nothing to do.');
                }
            } else {
                console.error('cannot sync file');
            }
        }

        DriveSync.prototype.marge = function () {

        }

        DriveSync.prototype.pull = function () {

        }

        DriveSync.prototype.push = function () {

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

    const R = {
        label: undefined,
        button_showlist: undefined,
        count: undefined,
        button_reblock: undefined,
        button_show: undefined,
        button_hidelist: undefined,
        button_complete: undefined,
        button_edit: undefined,
        contents: undefined,
        textarea_domains: undefined,
        blocked: undefined,
        info: undefined,
        result_container: undefined,
    }

    const LANGUAGE = (window.navigator.languages && window.navigator.languages[0]) ||
        window.navigator.language ||
        window.navigator.userLanguage ||
        window.navigator.browserLanguage;

    const TextResource = (function () {
        const TextResource = function () {};

        const _resource = {};

        TextResource.get = function (name) {
            if (!(name in _resource)) {
                let src = GM_getResourceText(name);
                let obj = JSON.parse(GM_getResourceText('languages'))
                    .filter(x => ~x.language.indexOf(LANGUAGE.toLowerCase()) || ~x.language.indexOf('en'))[0].ui; //english must be last.
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        src = src.replace('${' + key + '}', obj[key]);
                    }
                }
                _resource[name] = src;
            }
            return _resource[name];
        }
        return TextResource;
    })();

    const Patterns = (function () {
        const Patterns = {};
        Patterns.get = function () {
            return GM_getValue('url', '').split(';').filter(e => e);
        };
        Patterns.set = function (domains) {
            GM_setValue('url', domains.join(';'));
        };
        Patterns.add = function (pattern) {
            const list_ = Patterns.get();
            if (pattern && !~list_.indexOf(pattern)) list_.push(pattern);
            Patterns.set(list_)
        };
        Patterns.remove = function (pattern) {
            let list_ = Patterns.get();
            let newlist_ = list_.filter(e => e != pattern);
            Patterns.set(newlist_);
        };
        return Patterns;
    })();

    const Util = (function () {
        const Util = function () {};
        Util.distinct = function distinct(list, f = e => e) {
            var temp_ = list.map(x => f(x));
            return list.filter((value, index, self) => {
                return temp_.indexOf(f(value)) === index;
            });
        };
        Util.orderBy = function (list, ...fn) {
            return list.sort((a, b) => {
                for (let i = 0, len = fn.length; i < len; i++) {
                    const f = fn[i];
                    var aa = f(a),
                        bb = f(b);
                    if (aa > bb) return 1;
                    if (bb > aa) return -1;
                }
                return 0;
            });
        };
        Util.regex_escape = function (src) {
            const escapes = '\\*{}[]()^$.+|?';
            escapes.split('').forEach(e => src = src.replace(new RegExp(`\\${e}`, 'gi'), `\\${e}`));
            return src;
        };
        return Util;
    })();


    function showLabel() {
        const e = document.createElement('div');
        e.innerHTML = TextResource.get('label');
        R.result_container.appendChild(e);

        R.label = document.querySelector('#google_search_block');
        Object.assign(R, {
            button_showlist: R.label.querySelector('#google_search_block_button_showlist'),
            count: R.label.querySelector('#google_search_block_count'),
            button_reblock: R.label.querySelector('#google_search_block_button_reblock'),
            button_show: R.label.querySelector('#google_search_block_button_show'),
            button_hidelist: R.label.querySelector('#google_search_block_button_hidelist'),
            button_complete: R.label.querySelector('#google_search_block_button_complete'),
            button_edit: R.label.querySelector('#google_search_block_button_edit'),
            contents: R.label.querySelector('#google_search_block_contents'),
            textarea_domains: R.label.querySelector('#google_search_block_textarea_domains'),
            blocked: R.label.querySelector('#google_search_block_blocked'),
            info: R.label.querySelector('#google_search_block_info'),
        });
        R.label.classList.add(...SETTINGS.container_class.split(' '));
        R.button_complete.addEventListener('click', function () {
            R.textarea_domains.disabled = true;
            const list_ = Util.distinct(R.textarea_domains.value.split('\n').map(e => e.trim()).filter(e => e));
            Patterns.set(list_);
            BLOCK = list_;
            google_search_block();
            sync.initSync().then(() => sync.compare(true));
        });
        R.button_edit.addEventListener('click', function () {
            R.textarea_domains.disabled = false;
        });
        R.button_show.addEventListener('click', function () {
            document.querySelectorAll(SETTINGS.first).forEach(e => e.style.display = 'block');
            R.button_reblock.style.display = 'block';
            R.button_show.style.display = 'none';
        });
        R.button_reblock.addEventListener('click', function () {
            google_search_block();
            R.button_reblock.style.display = 'none';
            R.button_show.style.display = 'block';
        });
        R.button_hidelist.addEventListener('click', function () {
            R.button_showlist.style.display = 'block';
            R.button_hidelist.style.display = 'none';
            R.contents.style.display = 'none';
        });
        R.button_showlist.addEventListener('click', function () {
            R.button_showlist.style.display = 'none';
            R.button_hidelist.style.display = 'block';
            R.contents.style.display = 'block';
            R.textarea_domains.value = Patterns.get().sort().join('\n');
        });
        R.textarea_domains.disabled = true;
    }

    function getCandidate(url) {
        let c = new URL(url);
        let result = [];
        var split = c.host.split('.').reverse();
        var temp = split.shift();
        result.push({
            regex: temp,
            alias: temp
        });
        split.forEach(e => {
            temp = e + '.' + temp;
            result.push({
                regex: temp,
                alias: temp
            });
        });
        result.shift();
        const exclude = ['co.jp', 'ne.jp'];
        result = result.filter(e => !~exclude.indexOf(e.regex));

        var split = c.pathname.substr(1).split('/').filter(e => e);
        var temp = '#https?://' + Util.regex_escape(c.host);
        var temp_alias = c.host;
        split.pop();
        split.slice(0, 2).forEach(e => {
            temp += '/' + Util.regex_escape(e);
            temp_alias += '/' + e;
            result.push({
                regex: temp,
                alias: temp_alias
            });
        });
        return result;
    }


    function showBlockUI(parent, target_url) {
        let a = parent.querySelector('.google_search_block_blockui_container');
        if (a) a.remove();

        const div = document.createElement('div');
        div.className = 'google_search_block_blockui_container';
        div.innerHTML = TextResource.get('selectors');
        const contents_ = div.querySelector('.google_search_block_blockui_contents');

        //candidate list
        getCandidate(target_url).forEach(e => {
            const code = document.createElement('code');
            code.textContent = e.alias;

            const span = document.createElement('span');
            span.className = 'google_search_block_button';
            span.setAttribute('url', e.regex);
            span.addEventListener('click', function () {
                Patterns.add(this.getAttribute('url'));
                BLOCK = Patterns.get();
                div.remove();
                if (SETTINGS.result_box_style_class) {
                    parent.classList.remove(SETTINGS.result_box_style_class);
                }
                google_search_block();
                sync.initSync(() => sync.compare(true));
            });
            span.appendChild(code);

            contents_.appendChild(span);
        });
        parent.appendChild(div);
    }

    function showButton(parent, target_url) {
        var label = parent.querySelector('.google_search_block_buttons_container');
        if (!label) {
            let container = document.createElement('div');
            container.className = 'google_search_block_buttons_container';
            container.innerHTML = TextResource.get('buttons');
            parent.appendChild(container);
            container.querySelector('.google_search_block_button_openui').setAttribute('url', target_url);
            container.querySelector('.google_search_block_button_openui').addEventListener('click', function () {
                let url = this.getAttribute('url');
                showBlockUI(parent, url);
                this.style.display = 'none';
                parent.querySelector('.google_search_block_button_closeui').style.display = 'block';
                if (SETTINGS.result_box_style_class) {
                    parent.classList.add(SETTINGS.result_box_style_class);
                }
            });
            container.querySelector('.google_search_block_button_closeui').addEventListener('click', function () {
                parent.querySelector('.google_search_block_button_openui').style.display = 'block';
                this.style.display = 'none';
                parent.querySelector('.google_search_block_blockui').remove();
                if (SETTINGS.result_box_style_class) {
                    parent.classList.remove(SETTINGS.result_box_style_class);
                }
            });
        }
    }

    function google_search_block() {
        const start_ = performance.now();
        COUNT = 0;
        let blocked_ = [];
        document.querySelectorAll(SETTINGS.first).forEach(e => {
            const link_ = e.querySelector(SETTINGS.second);
            if (link_) {
                e.style['background-color'] = '';
                let removed_ = false;
                const url_ = link_.getAttribute('href');
                const host_ = new URL(url_).host;
                for (let i = 0, len = BLOCK.length; i < len; i++) {
                    const block_query_ = BLOCK[i];
                    if (block_query_.charAt(0) === '#' ? url_.match(new RegExp(block_query_.substr(1), 'g')) : host_.endsWith(block_query_)) {
                        e.style.display = 'none';
                        e.style['background-color'] = 'rgba(248, 195, 199, 0.884)';
                        removed_ = true;
                        blocked_.push(block_query_);
                        COUNT++;
                        break;
                    }
                }
                if (!removed_) e.style.display = 'block';
                showButton(e, url_);
            }
        });

        while (R.blocked.firstChild) R.blocked.removeChild(R.blocked.firstChild);

        //blocked buttons
        Util.distinct(blocked_).sort().forEach(e => {
            const code = document.createElement('code');
            code.textContent = e;

            const span = document.createElement('span');
            span.className = 'google_search_block_button';
            span.setAttribute('domain', e);
            span.addEventListener('click', function () {
                var domain = this.getAttribute('domain');
                Patterns.remove(domain);
                BLOCK = Patterns.get();
                google_search_block();
                sync.initSync(() => sync.compare(true));
            });
            span.appendChild(code);

            R.blocked.appendChild(span);
        });

        google_search_block_count.textContent = COUNT;
        R.textarea_domains.value = Patterns.get().sort().join('\n');
        R.info.textContent = `${Math.floor((performance.now() - start_)*10)/10}ms ${BLOCK.length}`;
    }


    function init() {
        //detect environment
        let environment_ = null;
        if (location.host === 'www.google.com' || location.host === 'www.google.co.jp') {
            environment_ = document.querySelector('#search') ? 'pc' : 'mobile';
        } else if (location.host === 'www.bing.com') {
            environment_ = document.querySelector('[name="mobileoptimized"]') ? "bing_mobile" : 'bing_pc';
        } else if (location.host === 'search.yahoo.co.jp') {
            environment_ = document.querySelector('#WS2m') ? "yahoo_pc" : 'yahoo_mobile';
        }
        console.log(environment_);
        //load settings
        JSON.parse(TextResource.get('environments')).forEach(e => {
            if (e.environment === environment_) {
                SETTINGS = e;
            }
        });
        if (!(R.result_container = document.querySelector(SETTINGS.result_container)))
            throw new Error('result container not found.');

        if (environment_ === 'mobile') {
            const observer_ = new MutationObserver(function (records, mo) {
                if (records.filter(x => {
                        return ('getAttribute' in x.target) && x.target.getAttribute('data-graft-type') === 'insert';
                    }).length) {
                    google_search_block();
                }
            });
            observer_.observe(document.querySelector(SETTINGS.observer_target), {
                attributes: true,
                childList: true,
                characterData: true,
                attributeFilter: [],
                subtree: true
            });
        }
    }


    let BLOCK = Util.distinct(Patterns.get());
    let COUNT = 0;
    let SETTINGS = null;

    const CLIENT_ID = '531665009269-96fvecl3pj4717mj2e6if6oaph7eu8ar.apps.googleusercontent.com';
    const LIST_FILE_NAME = 'GoogleSearchBlocker.txt';

    const sync = new DriveSync(CLIENT_ID, LIST_FILE_NAME, (time) => {
        GM_setValue('modified', time.toString());
    }, () => {
        return parseInt(GM_getValue('modified', '0'));
    }, data => {
        console.log('download', data.split('\n'));
        Patterns.set(data.split('\n'));
        BLOCK = Patterns.get();
        google_search_block();
    }, () => {
        console.log('upload', Patterns.get());
        return Patterns.get().join('\n');
    });
    sync.initSync().then(() => sync.compare());


    init();
    showLabel();
    google_search_block();
})();