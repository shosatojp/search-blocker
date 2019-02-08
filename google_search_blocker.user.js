// ==UserScript==
// @name         Google Search Blocker (Auto Pagerize Beta)
// @namespace    https://github.com/shosatojp/google_search_blocker
// @homepage     https://github.com/shosatojp/google_search_blocker
// @version      0.10.20.0
// @description  Block undesired sites from google search results!
// @author       Sho Sato
// @match        https://www.google.com/search?*
// @match        https://www.google.co.jp/search?*
// @match        https://www.bing.com/search?*
// @match        https://search.yahoo.co.jp/*
// @resource     label        https://github.com/shosatojp/google_search_blocker/raw/auto_pagerize/container.html?
// @resource     float        https://github.com/shosatojp/google_search_blocker/raw/auto_pagerize/float.html?
// @resource     buttons      https://github.com/shosatojp/google_search_blocker/raw/master/buttons.html?
// @resource     selectors    https://github.com/shosatojp/google_search_blocker/raw/master/selectors.html?
// @resource     environments https://github.com/shosatojp/google_search_blocker/raw/master/environments.json?
// @resource     languages    https://github.com/shosatojp/google_search_blocker/raw/auto_pagerize/languages.json?
// @updateURL    https://github.com/shosatojp/google_search_blocker/raw/auto_pagerize/google_search_blocker.user.js?
// @downloadURL  https://github.com/shosatojp/google_search_blocker/raw/auto_pagerize/google_search_blocker.user.js?
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';
    console.log(`%cGoogle Search Blocker ${GM_info.script.version}`, 'color:lightseagreen;font-size:large;');
    console.log(`%cCopyright © 2019 Sho Sato. All Rights Reserved.`, 'color:lightseagreen;');

    //For bing.com. (bing overrides these functions.)
    const Element_prototype_appendChild = Element.prototype.appendChild;
    const Element_prototype_insertBefore = Element.prototype.insertBefore;

    const Colors = {
        Red: '#F44336',
        Pink: '#E91E63',
        Purple: '#9C27B0',
        Deeppurple: '#673AB7',
        Indigo: '#3F51B5',
        Blue: '#2196F3',
        LightBlue: '#03A9F4',
        Cyan: '#00BCD4',
        Teal: '#009688',
        Green: '#4CAF50',
        LightGreen: '#8BC34A',
        Lime: '#CDDC39',
        Yellow: '#FFEB3B',
        Amber: '#FFC107',
        Orange: '#FF9800',
        DeepOrange: '#FF5722',
        Brown: '#795548',
        Gray: '#9E9E9E',
        BlueGray: '#607D8B'
    }

    //Sync library for google drive.
    const DriveSync = (function () {
        const DriveSync = function (client_id, filename, setModifiedTime, getModifiedTime, defaultOnDownload, defaultGetData, usesync, setUseSync, onsignin, onsignout) {
            this.CLIENT_ID = client_id;
            this.FILE_NAME = filename;
            this.setModifiedTime = setModifiedTime;
            this.getModifiedTime = getModifiedTime;
            this.defaultOnDownload = defaultOnDownload;
            this.defaultGetData = defaultGetData;
            this.usesync = usesync;
            this.setUseSync = setUseSync;
            this.onsignin = onsignin;
            this.onsignout = onsignout;
        };

        DriveSync.prototype.request = async function (e) {
            return await gapi.client.request(e);
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
                console.log('server:', serverModifiedTime, serverModifiedTime === localModifiedTime ? '=' : serverModifiedTime > localModifiedTime ? '>' : '<', 'local:', localModifiedTime);
                if (localModifiedTime < serverModifiedTime) {
                    onDownload(await this.getFileContent(file.id), serverModifiedTime);
                    this.setModifiedTime(serverModifiedTime);
                } else if (localModifiedTime > serverModifiedTime) {
                    await this.updateFileContent(file.id, getData());
                    this.setModifiedTime(Date.now());
                    this.setModifiedTime(new Date((await this.findFile(this.FILE_NAME)).modifiedTime).getTime());
                } else {
                    console.log('nothing to do.');
                }
            } else {
                console.error('%ccannot sync file', `color:${Colors.Red};`);
            }
        }

        DriveSync.prototype.marge = function () {

        }

        DriveSync.prototype.pull = function () {

        }

        DriveSync.prototype.push = function () {

        }


        DriveSync.prototype.signIn = function () {
            return new Promise((res, rej) => {
                if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
                    console.log('%calready signed in', `color:${Colors.Green};`);
                    this.onsignin();
                    res();
                } else {
                    this.authenticate().then(() => {
                        console.log('%csigned in',`color:${Colors.Green};`);
                        this.onsignin();
                        res();
                    }, () => {
                        console.log('%csigned in failed', `color:${Colors.Green};`);
                        this.onsignout();
                        rej();
                    });
                }
            });
        }

        DriveSync.prototype.initSync = function () {
            const self = this;
            return new Promise(((res, rej) => {
                if (!this.usesync()) {
                    rej();
                    return;
                }
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

        DriveSync.prototype.signOut = function () {
            gapi.auth2.getAuthInstance().signOut();
            this.onsignout();
            console.log('%csigned out',`color:${Colors.Green};`);

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
        signin: undefined,
        signout: undefined,
        syncinfo: undefined,
        float:undefined,
    }

    const LANGUAGE = (window.navigator.languages && window.navigator.languages[0]) ||
        window.navigator.language ||
        window.navigator.userLanguage ||
        window.navigator.browserLanguage;
    const LOCAL_STRING = JSON.parse(GM_getResourceText('languages'))
        .filter(x => ~x.language.indexOf(LANGUAGE.toLowerCase()) || ~x.language.indexOf('en'))[0].ui;

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
            return (navigator.userAgent.match(/Android/i) ||
                navigator.userAgent.match(/webOS/i) ||
                navigator.userAgent.match(/iPhone/i) ||
                navigator.userAgent.match(/iPad/i) ||
                navigator.userAgent.match(/iPod/i) ||
                navigator.userAgent.match(/BlackBerry/i) ||
                navigator.userAgent.match(/Windows Phone/i));
            // return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
        };
        Util.getUrlParams = function (url) {
            const result = {};
            new URL(url).search.substring(1).split('&').forEach(e => {
                const pair = e.split('=');
                if (pair.length === 2) {
                    result[pair[0]] = pair[1].length ? pair[1] : null;
                }
            });
            return result;
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
                    self.open_button_.style.display = 'block';
                    self.close_button_.style.display = 'none';
                    SYNC.initSync().then(() => SYNC.compare(true)).catch(() => {
                        SYNC.setModifiedTime(Date.now());
                    });
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
                        removed_ = block_pattern_ ;
                        if (!~blocked_patterns_.indexOf(block_pattern_)) {
                            blocked_patterns_.push(block_pattern_);
                            if (R.blocked) GoogleSearchBlock.createButton(block_pattern_);
                        }
                        COUNT++;
                        console.log('one', COUNT);
                        break;
                    }
                }
                if (!removed_) e.style.display = 'block';
                new Controller(e, url_).createButton();
            }
            time += performance.now() - start_;
            return removed_;
        };

        GoogleSearchBlock.all = function (aggregate = true) {
            const start_ = performance.now();
            // let count_ = 0;
            blocked_patterns_ = [];
            // COUNT=0;
            document.querySelectorAll(SETTINGS.first).forEach(e => {
                if (GoogleSearchBlock.one(e)) count_++;
            });
            // COUNT = count_;
            // console.log('all', count_);
            time = performance.now() - start_;
            if (aggregate)
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
                SYNC.initSync().then(() => SYNC.compare(true)).catch(() => {
                    SYNC.setModifiedTime(Date.now());
                });
            });
            span.appendChild(code);

            R.blocked.appendChild(span);
        };
        return GoogleSearchBlock;
    })();

    //initialize form (bottom of the page)
    function initializeForm(container) {
        const e = document.createElement('div');
        e.innerHTML = TextResource.get('label');
        container.appendChild(e);

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
            signin: R.label.querySelector('#google_search_block_button_signin'),
            signout: R.label.querySelector('#google_search_block_button_signout'),
            syncinfo: R.label.querySelector('#google_search_block_button_syncinfo'),
            float:R.label.querySelector('#google_search_block_float'),
        });
        R.label.classList.add(...SETTINGS.container_class.split(' '));
        R.button_complete.addEventListener('click', function () {
            R.textarea_domains.disabled = true;
            R.textarea_domains.style.overflow='hidden';
            const list_ = Util.distinct(R.textarea_domains.value.split('\n').map(e => e.trim()).filter(e => e));
            Patterns.set(list_);
            BLOCK = list_;
            GoogleSearchBlock.all();
            SYNC.initSync().then(() => SYNC.compare(true)).catch(() => {
                SYNC.setModifiedTime(Date.now());
            });
        });
        R.button_edit.addEventListener('click', function () {
            R.textarea_domains.disabled = false;
            R.textarea_domains.style.overflow='unset';
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
        R.signin.addEventListener('click', function () {
            R.syncinfo.textContent = '';
            SYNC.setUseSync(true);
            SYNC.initSync().then(() => {
                SYNC.compare();
            }).catch(() => {
                R.syncinfo.textContent = LOCAL_STRING.failedtosync;
                SYNC.setUseSync(false);
            });
        });
        R.signout.addEventListener('click', function () {
            R.syncinfo.textContent = '';
            SYNC.setUseSync(false);
            SYNC.signOut();
        });
        R.float.addEventListener('change', function () {
            Float.set(this.checked);
            location.reload();
        });
        R.float.checked=Float.get();
        R.textarea_domains.disabled = true;
    }

    const Float = (function () {
        const Float ={};
        
        Float.init= function () {
            document.body.insertAdjacentHTML('beforeEnd', TextResource.get('float'));
            Float.button_open = document.querySelector('#google_search_block_float_button_open');
            Float.button_close = document.querySelector('#google_search_block_float_button_close');
            Float.container = document.querySelector('#google_search_block_float_container');
            Float.button_open.addEventListener('click', function () {
                Float.button_close.style.display = 'block';
                Float.button_open.style.display = 'none';
                Float.container.style.display = 'flex';
            });
            Float.button_close.addEventListener('click', function () {
                Float.button_open.style.display = 'block';
                Float.button_close.style.display = 'none';
                Float.container.style.display = 'none';
            });
        };
        Float.getContainer = function () {
            return Float.container;
        };
        Float.set = function (bool) {
            GM_setValue('float', (+bool).toString());
        };
        Float.get = function () {
            return !!parseInt(GM_getValue('float', '0'));
        };
        return Float;
    })();

    //select function for observer by environment
    function getObserverFunction(environment) {
        const walkAddedNodesInRecords = function (compare) {
            return (function (classname) {
                return (function (records, callback) {
                    for (const record of records) {
                        for (const node of record.addedNodes) {
                            if (compare(node, classname)) {
                                callback(node);
                            }
                        }
                    }
                });
            });
        };

        const containsInClassListWhenAdded = walkAddedNodesInRecords((node, classname) => node instanceof Element && node.classList.contains(classname));
        const equalsClassNameWhenAdded = walkAddedNodesInRecords((node, classname) => node instanceof Element && node.className === classname);

        switch (environment) {
            case 'pc':
                return containsInClassListWhenAdded('g');
            case 'mobile':
                return containsInClassListWhenAdded('xpd');
            case 'bing_pc':
                return equalsClassNameWhenAdded('b_algo');
            case 'bing_mobile':
                return equalsClassNameWhenAdded('b_algo');
            case 'yahoo_pc':
                return equalsClassNameWhenAdded('w');
            case 'yahoo_mobile':
                return equalsClassNameWhenAdded('sw-CardBase');
            default:
                throw new Error('invalid environment');
        }
    }
    //initializer
    function init() {
        let environment_ = null;

        { //detect environment
            const isMobile_ = Util.isMobileDevice();
            if (location.host === 'www.google.com' || location.host === 'www.google.co.jp') {
                if (Util.getUrlParams(location.href).tbm) {
                    console.warn('this page is not a search result page.')
                    return;
                }
                environment_ = isMobile_ ? 'mobile' : 'pc';
            } else if (location.host === 'www.bing.com') {
                environment_ = isMobile_ ? "bing_mobile" : 'bing_pc';
            } else if (location.host === 'search.yahoo.co.jp') {
                environment_ = isMobile_ ? 'yahoo_mobile' : "yahoo_pc";
            }
            console.log('environment:', environment_);
        }

        { //load settings
            JSON.parse(TextResource.get('environments')).forEach(e => {
                if (e.environment === environment_) {
                    SETTINGS = e;
                }
            });
        }

        //if there are any elements before observe, block these elements.
        console.log(document.querySelectorAll(SETTINGS.first).length+' elements was found before start MutationObserver');
        GoogleSearchBlock.all(false);

        //use MutationObserver from document-start
        const mutation_processed_ = [];
        const onmutated = getObserverFunction(environment_);
        const observer_ = new MutationObserver(function (records) {
            onmutated(records, (element) => {
                if (!~mutation_processed_.indexOf(element)) {
                    GoogleSearchBlock.one(element);
                    mutation_processed_.push(element);
                }
            });
        });
        observer_.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        window.addEventListener('DOMContentLoaded', function () {
            console.log('%c----------DOMContentLoaded----------',`color:${Colors.LightBlue};`);

            //check if ...
            if (!(R.result_container = document.querySelector(SETTINGS.result_container))) {
                console.error('result container not found.');
                return;
            }

            COUNT = 0;
            if(Float.get()){
                Float.init();
                initializeForm(Float.getContainer());
            }else{
                initializeForm(R.result_container);
            }
            GoogleSearchBlock.all();

            { //google mobile ajax load.
                if (environment_ === 'mobile') {
                    const observer_ = new MutationObserver(function (records, mo) {
                        if (records.filter(x => {
                                return ('getAttribute' in x.target) && x.target.getAttribute('data-graft-type') === 'insert';
                            }).length) {
                            COUNT = 0;
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

            window.addEventListener('load', function () {
                console.log('%c----------------load----------------',`color:${Colors.LightGreen};`);

                Element.prototype.insertBefore = Element_prototype_insertBefore;
                Element.prototype.appendChild = Element_prototype_appendChild;

                //initialize sync feature.
                (SYNC = new DriveSync(CLIENT_ID, LIST_FILE_NAME, (time) => {
                    GM_setValue('modified', time.toString());
                }, () => {
                    return parseInt(GM_getValue('modified', '0'));
                }, data => {
                    console.log('%cDOWNLOAD', `color:${Colors.Pink};`, data.split('\n').length);
                    Patterns.set(data.split('\n'));
                    BLOCK = Patterns.get();
                    GoogleSearchBlock.all();
                }, () => {
                    console.log('%cUPLOAD', `color:${Colors.Blue};`, Patterns.get().length);
                    return Patterns.get().join('\n');
                }, function usesync() {
                    return !!parseInt(GM_getValue('usesync', '0'));
                }, function setusesync(bool) {
                    GM_setValue('usesync', (+bool).toString());
                }, function onsignin() {
                    R.signin.style.display = 'none';
                    R.signout.style.display = 'block';
                    R.syncinfo.textContent = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail();
                }, function onsignout() {
                    R.signin.style.display = 'block';
                    R.signout.style.display = 'none';
                })).initSync().then(() => SYNC.compare()).catch(() => {});

            });
        });
    }

    //client id of this application.
    const CLIENT_ID = '531665009269-96fvecl3pj4717mj2e6if6oaph7eu8ar.apps.googleusercontent.com';
    //name of block list file in google drive.
    const LIST_FILE_NAME = 'GoogleSearchBlocker.txt';

    //number of blocked elements.
    let COUNT = 0;
    //settings from environments.json
    let SETTINGS = null;
    //instance of DriveSync
    let SYNC = null;
    //block list
    let BLOCK = Util.distinct(Patterns.get());

    init();

})();