// ==UserScript==
// @name         Google Search Blocker (Sync Beta)
// @namespace    https://github.com/ShoSatoJp/sync
// @version      0.10.1
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

    //For bing.com. (bing overrides these functions.)
    const Element_prototype_appendChild = Element.prototype.appendChild;
    const Element_prototype_insertBefore = Element.prototype.insertBefore;

    //Sync library for google drive.
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

        DriveSync.prototype.request = async function (e) {
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

        DriveSync.prototype.createFile = async function (name) {
            return (await this.request({
                path: '/drive/v3/files',
                method: 'POST',
                body: {
                    name: name
                }
            })).result;
        }

        DriveSync.prototype.findFile = async function (name) {
            return (await this.request({
                path: '/drive/v3/files',
                method: 'GET',
                params: {
                    q: `name = '${name}' and trashed = false`,
                    fields: 'files(id, modifiedTime)'
                }
            })).result.files[0];
        }

        DriveSync.prototype.updateFileContent = async function (id, content) {
            await this.request({
                path: `/upload/drive/v3/files/${id}`,
                method: 'PATCH',
                params: {
                    uploadType: 'media'
                },
                body: content
            });
            return new Date((await this.findFile(this.FILE_NAME)).modifiedTime).getTime();
        }

        DriveSync.prototype.getFileContent = async function (id) {
            return (await this.request({
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
            if (!(file = await this.findFile(this.FILE_NAME))) {
                file = await this.createFile(this.FILE_NAME);
            }

            if (file) {
                const serverModifiedTime = new Date(file.modifiedTime).getTime();
                const localModifiedTime = this.getModifiedTime();
                console.log('server:', serverModifiedTime, ' local:', localModifiedTime);
                if (localModifiedTime < serverModifiedTime) {
                    onDownload(await this.getFileContent(file.id), serverModifiedTime);
                    this.setModifiedTime(serverModifiedTime);
                } else if (localModifiedTime > serverModifiedTime) {
                    this.setModifiedTime(await this.updateFileContent(file.id, getData()));
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
                    // Element_prototype_appendChild.call(document.body, script);
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

    //Ui elements
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

    //Resource manager
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

    //Pattern manager
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
        Util.getCandidate = function (url) {
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
        Util.isMobileDevice = function () {
            return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
        };
        return Util;
    })();

    //Controller for each result element.
    const Controller = (function () {
        const Controller = function (parent, target_url) {
            this.parent = parent;
            this.target_url = target_url;
            this.open_button_ = undefined;
            this.close_button_ = undefined;
        };

        Controller.prototype.createButton = function () {
            if (!this.parent.querySelector('.google_search_block_buttons_container')) {
                const container_ = document.createElement('div');
                container_.className = 'google_search_block_buttons_container';
                container_.innerHTML = TextResource.get('buttons');

                this.open_button_ = container_.querySelector('.google_search_block_button_openui');
                this.close_button_ = container_.querySelector('.google_search_block_button_closeui');

                this.open_button_.addEventListener('click', this.openButton.bind(this));
                this.close_button_.addEventListener('click', this.closeButton.bind(this));

                this.parent.appendChild(container_);
            }
        }

        Controller.prototype.openButton = function () {
            // createController(this.parent, this.target_url);
            this.create();
            this.open_button_.style.display = 'none';
            this.close_button_.style.display = 'block';
            if (SETTINGS.result_box_style_class) {
                this.parent.classList.add(SETTINGS.result_box_style_class);
            }
        };

        Controller.prototype.closeButton = function () {
            this.open_button_.style.display = 'block';
            this.close_button_.style.display = 'none';
            this.parent.querySelector('.google_search_block_blockui').remove();
            if (SETTINGS.result_box_style_class) {
                this.parent.classList.remove(SETTINGS.result_box_style_class);
            }
        };

        Controller.prototype.create = function () {
            const self = this;
            const class_name = 'google_search_block_blockui_container';
            //remove if already exists the controller
            let old_ = self.parent.querySelector('.' + class_name);
            if (old_) old_.remove();

            //wrapper
            const div = document.createElement('div');
            div.className = class_name;
            div.innerHTML = TextResource.get('selectors');
            const contents_ = div.querySelector('.google_search_block_blockui_contents');

            //candidate list
            Util.getCandidate(self.target_url).forEach(e => {
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
                        self.parent.classList.remove(SETTINGS.result_box_style_class);
                    }
                    GoogleSearchBlock.all();
                    SYNC.initSync(() => SYNC.compare(true));
                });
                span.appendChild(code);

                contents_.appendChild(span);
            });
            self.parent.appendChild(div);
        }

        return Controller;
    })();

    //main class for blocking search result.
    const GoogleSearchBlock = (function () {
        const GoogleSearchBlock = {};

        let blocked_patterns_ = [];
        let time = 0;

        GoogleSearchBlock.one = function (e) {
            const start_ = performance.now();
            const link_ = e.querySelector(SETTINGS.second);
            let removed_ = false;
            if (link_) {
                e.style['background-color'] = '';
                const url_ = link_.getAttribute('href');
                if (!url_.startsWith('http')) return;
                const host_ = new URL(url_).host;
                for (let i = 0, len = BLOCK.length; i < len; i++) {
                    const block_pattern_ = BLOCK[i];
                    if (block_pattern_.charAt(0) === '#' ? url_.match(new RegExp(block_pattern_.substr(1), 'g')) : host_.endsWith(block_pattern_)) {
                        e.style.display = 'none';
                        e.style['background-color'] = 'rgba(248, 195, 199, 0.884)';
                        removed_ = true;
                        if (!~blocked_patterns_.indexOf(block_pattern_)) {
                            blocked_patterns_.push(block_pattern_);
                            if (R.blocked) GoogleSearchBlock.createButton(block_pattern_);
                        }
                        COUNT++;
                        if (R.count) R.count.textContent = COUNT;
                        break;
                    }
                }
                if (!removed_) e.style.display = 'block';
                new Controller(e, url_).createButton();
            }
            time += performance.now() - start_;
            return removed_;
        };

        GoogleSearchBlock.all = function () {
            const start_ = performance.now();
            COUNT = 0;
            blocked_patterns_ = [];
            document.querySelectorAll(SETTINGS.first).forEach(e => {
                GoogleSearchBlock.one(e);
            });
            time = performance.now() - start_;
            GoogleSearchBlock.aggregate();
        };

        GoogleSearchBlock.aggregate = function () {
            while (R.blocked.firstChild) R.blocked.removeChild(R.blocked.firstChild);

            //blocked buttons
            Util.distinct(blocked_patterns_).sort().forEach(e => {
                GoogleSearchBlock.createButton(e);
            });

            R.count.textContent = COUNT;
            R.textarea_domains.value = Patterns.get().sort().join('\n');
            R.info.textContent = `${Math.floor(time*10)/10}ms ${BLOCK.length}`;
        };

        GoogleSearchBlock.createButton = function (pattern) {
            const code = document.createElement('code');
            code.textContent = pattern;

            const span = document.createElement('span');
            span.className = 'google_search_block_button';
            span.setAttribute('domain', pattern);
            span.addEventListener('click', function () {
                var domain = this.getAttribute('domain');
                Patterns.remove(domain);
                BLOCK = Patterns.get();
                GoogleSearchBlock.all();
                SYNC.initSync(() => SYNC.compare(true));
            });
            span.appendChild(code);

            R.blocked.appendChild(span);
        };
        return GoogleSearchBlock;
    })();

    //initialize form (bottom of the page)
    function initializeForm() {
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
            GoogleSearchBlock.all();
            SYNC.initSync().then(() => SYNC.compare(true));
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
            GoogleSearchBlock.all();
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

    //select function for observer by environment
    function getObserverFunction(environment) {
        var fn;
        switch (environment) {
            case 'pc':
                fn = (function (records, callback) {
                    records = records.filter(x => {
                        return x.target.className === 'g' && x.addedNodes.length;
                    });
                    records.forEach(x => {
                        x.addedNodes.forEach(b => {
                            if (b.tagName === 'DIV') {
                                callback(x.target);
                            }
                        });
                    });
                });
                break;
            case 'mobile':
                fn = (function (records, callback) {
                    records = records.filter(x => {
                        return x.target && x.target.classList && x.target.classList.contains('xpd'); // && x.addedNodes.length;
                    });
                    records.forEach(x => {
                        x.addedNodes.forEach(b => {
                            if (b.tagName === 'DIV') {
                                callback(x.target);
                            }
                        });
                    });
                });
                break;
            case 'bing_pc':
                fn = (function (records, callback) {
                    records = records.filter(x => {
                        return x.target.className === 'b_algo';
                    });
                    records.forEach(x => {
                        callback(x.target);
                    });
                });
                break;
            case 'bing_mobile':
                fn = (function (records, callback) {
                    records = records.filter(x => {
                        return x.target.className === 'b_algo';
                    });
                    records.forEach(x => {
                        callback(x.target);
                    });
                });
                break;
            case 'yahoo_pc':
                fn = (function (records, callback) {
                    records = records.filter(x => {
                        return x.target.className === 'w';
                    });
                    records.forEach(x => {
                        callback(x.target);
                    });
                });
                break;
            case 'yahoo_mobile':
                fn = (function (records, callback) {
                    records = records.filter(x => {
                        return x.target.className === 'sw-CardBase';
                    });
                    records.forEach(x => {
                        callback(x.target);
                    });
                });
                break;
        }
        return fn;
    }

    //initializer
    function init() {
        let environment_ = null;

        { //detect environment
            const isMobile_ = Util.isMobileDevice();
            if (location.host === 'www.google.com' || location.host === 'www.google.co.jp') {
                environment_ = isMobile_ ? 'mobile' : 'pc';
            } else if (location.host === 'www.bing.com') {
                environment_ = isMobile_ ? "bing_mobile" : 'bing_pc';
            } else if (location.host === 'search.yahoo.co.jp') {
                environment_ = isMobile_ ? 'yahoo_mobile' : "yahoo_pc";
            }
            console.log(environment_);
        }

        { //load settings
            JSON.parse(TextResource.get('environments')).forEach(e => {
                if (e.environment === environment_) {
                    SETTINGS = e;
                }
            });
        }

        { //use MutationObserver from document-start
            const mutation_processed_ = [];
            const observer_ = new MutationObserver(function (records) {
                getObserverFunction(environment_)(records, (element) => {
                    if (!~mutation_processed_.indexOf(element)) {
                        GoogleSearchBlock.one(element);
                        mutation_processed_.push(element);
                    }
                });
            });
            observer_.observe(document, {
                attributes: true,
                childList: true,
                characterData: true,
                attributeFilter: [],
                subtree: true
            });
        }

        window.onload = function () {
            console.log('----------------------------------');

            Element.prototype.insertBefore = Element_prototype_insertBefore;
            Element.prototype.appendChild = Element_prototype_appendChild;

            //check if ...
            if (!(R.result_container = document.querySelector(SETTINGS.result_container))) {
                console.error('result container not found.');
                return;
            }

            //initialize sync feature.
            (SYNC = new DriveSync(CLIENT_ID, LIST_FILE_NAME, (time) => {
                GM_setValue('modified', time.toString());
            }, () => {
                return parseInt(GM_getValue('modified', '0'));
            }, data => {
                console.log('download', data.split('\n').length);
                Patterns.set(data.split('\n'));
                BLOCK = Patterns.get();
                GoogleSearchBlock.all();
            }, () => {
                console.log('upload', Patterns.get().length);
                return Patterns.get().join('\n');
            })).initSync().then(() => SYNC.compare());


            initializeForm();
            GoogleSearchBlock.aggregate();

            { //google mobile ajax load.
                if (environment_ === 'mobile') {
                    const observer_ = new MutationObserver(function (records, mo) {
                        if (records.filter(x => {
                                return ('getAttribute' in x.target) && x.target.getAttribute('data-graft-type') === 'insert';
                            }).length) {
                            GoogleSearchBlock.all();
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
        }
    }

    //client id of this application.
    const CLIENT_ID = '531665009269-96fvecl3pj4717mj2e6if6oaph7eu8ar.apps.googleusercontent.com';
    //name of block list file in google drive.
    const LIST_FILE_NAME = 'GoogleSearchBlocker.txt';

    //block list
    let BLOCK = Util.distinct(Patterns.get());
    //number of blocked elements.
    let COUNT = 0;
    //settings from environments.json
    let SETTINGS = null;
    //instance of DriveSync
    let SYNC = null;

    init();
})();