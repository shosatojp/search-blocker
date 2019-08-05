// ==UserScript==
// @name         Google Search Blocker
// @namespace    https://github.com/shosatojp/google_search_blocker/raw/master/google_search_blocker.user.js
// @homepage     https://github.com/shosatojp/google_search_blocker
// @version      1.0
// @description  Block undesired sites from google search results!
// @author       Sho Sato
// @match        https://www.google.com/search?*
// @match        https://www.google.co.jp/search?*
// @match        https://www.bing.com/search?*
// @match        https://search.yahoo.co.jp/*
// @resource     form         ./form.html?
// @resource     modal        ./modal.html?
// @resource     buttons      ./buttons.html?
// @resource     selectors    ./selectors.html?
// @resource     environments ./environments.json?
// @resource     languages    ./languages.json?
// @resource     button_blocked_rule    ./button_blocked_rule.html?
// @updateURL    https://github.com/shosatojp/google_search_blocker/raw/master/google_search_blocker.user.js?
// @downloadURL  https://github.com/shosatojp/google_search_blocker/raw/master/google_search_blocker.user.js?
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @run-at       document-start
// @noframes
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
                    scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file",
                    prompt: 'select_account'
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

        DriveSync.prototype.compare = async function (onDownload, getData) {
            onDownload = onDownload || this.defaultOnDownload;
            getData = getData || this.defaultGetData;
            var file;
            if ((file = await this.findFile(this.FILE_NAME)) || (file = await this.createFile(this.FILE_NAME))) {
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
        };

        DriveSync.prototype.marge = function () {

        }

        DriveSync.prototype.pull = function () {

        }

        DriveSync.prototype.push = async function () {
            var file;
            if ((file = await this.findFile(this.FILE_NAME)) || (file = await this.createFile(this.FILE_NAME))) {
                await this.updateFileContent(file.id, this.defaultGetData());
                this.setModifiedTime(Date.now());
                this.setModifiedTime(new Date((await this.findFile(this.FILE_NAME)).modifiedTime).getTime());
            } else {
                console.error('%ccannot sync file', `color:${Colors.Red};`);
            }
        };

        DriveSync.prototype.signIn = function () {
            return new Promise((res, rej) => {
                if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
                    console.log('%calready signed in', `color:${Colors.Green};`);
                    this.onsignin();
                    res();
                } else {
                    this.authenticate().then(() => {
                        console.log('%csigned in', `color:${Colors.Green};`);
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
            console.log('%csigned out', `color:${Colors.Green};`);

        }

        return DriveSync;
    })();

    //Ui elements
    const R = {
        form: undefined,
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
        modal: undefined,
        select: undefined,
    }

    const LANGUAGE = (window.navigator.languages && window.navigator.languages[0]) ||
        window.navigator.language ||
        window.navigator.userLanguage ||
        window.navigator.browserLanguage;
    const LOCAL_STRING = JSON.parse(GM_getResourceText('languages'))
        .filter(x => ~x.language.indexOf(LANGUAGE.toLowerCase()) || ~x.language.indexOf('en'))[0].ui;

    //Resource manager
    const TextResource = (function () {
        const TextResource = {};

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

    const Util = (function () {
        const Util = {};
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
        Util.regex_escape = function (n) {
            return n.replace(/([.?*+^$&[\]\\(){}|<>-])/g, "\\$1")
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
            var temp = c.host + '$prefix(\'';
            var temp_alias = c.host;
            split.pop();
            split.slice(0, 2).forEach(e => {
                temp += '/' + e.replace('\'', '\\\'');
                temp_alias += '/' + e;
                result.push({
                    regex: temp + '\')',
                    alias: temp_alias
                });
            });
            return result;
        };
        Util.isMobileDevice = function () {
            return navigator.userAgent.match(/(Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone)/i);
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
            if (!this.parent.querySelector('.google_search_block_buttons_form')) {
                const container_ = document.createElement('div');
                container_.className = 'google_search_block_buttons_form';
                container_.innerHTML = TextResource.get('buttons');

                this.open_button_ = container_.querySelector('.google_search_block_button_openui');
                this.close_button_ = container_.querySelector('.google_search_block_button_closeui');

                this.open_button_.addEventListener('click', this.openButton.bind(this));
                this.close_button_.addEventListener('click', this.closeButton.bind(this));

                this.parent.appendChild(container_);
            }
        }

        Controller.prototype.openButton = function () {
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

            if (self.parent.isredisplay && self.parent.blocked) {
                // overflow-x:auto position:absolute error
                const fragment = document.createDocumentFragment();
                GoogleSearchBlock.getMatchRules(self.parent).forEach(rule => {
                    GoogleSearchBlock.createButton(rule.source, fragment);
                });
                contents_.appendChild(fragment);
                self.parent.appendChild(div);
            } else {
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
                        SYNC.initSync().then(() => SYNC.push()).catch(() => {
                            SYNC.setModifiedTime(Date.now());
                        });
                    });
                    span.appendChild(code);

                    contents_.appendChild(span);
                });
                self.parent.appendChild(div);
            }
        }

        return Controller;
    })();

    //Pattern manager
    /**
     * envに対応させる setenv後にblockに代入する
     */
    const Patterns = (function () {
        //互換性対応 inherit
        const Patterns = {};
        let current_env_id = localStorage.getItem('env') || 'main';
        Patterns.get_current_env_id = function () {
            return current_env_id;
        };
        Patterns._get_basic = function () {
            return GM_getValue('rules_v03', {
                main: {
                    rules: []
                }
            });
        };
        Patterns._set_basic = function (obj) {
            GM_setValue('rules_v03', obj)
        };
        Patterns.resolve_inherit = function (target_env_id, environment) {
            const env = environment[target_env_id];
            if (env.inherits) env.inherits.forEach(env_id => {
                env.rules = [...env.rules, ...Patterns.resolve_inherit(env_id, environment).rules];
            });
            return environment[target_env_id];
        };
        Patterns.get = function () {
            const envs = Patterns._get_basic();
            const env = envs[current_env_id];
            const rules = (env && Patterns.resolve_inherit(current_env_id, envs).rules) || [];
            return rules.map(e => Object.setPrototypeOf(e, Rule.prototype)).map(e => (e.make_command_function(), e));
        };
        // Patterns.get_json = function () {
        //     return JSON.stringify(Patterns.get());
        // };
        Patterns.set = function (list) {
            Patterns._set_basic(Patterns.parse_env(list));
        };
        Patterns.set_json = function (json) {
            Patterns._set_basic(JSON.parse(json));
        };
        Patterns.add = function (src) {
            const e = Patterns._get_basic();
            e[current_env_id].rules.push(new Rule(src));
            Patterns._set_basic(e);
        };
        Patterns.remove = function (src) {
            const e = Patterns._get_basic();
            e[current_env_id].rules = e[current_env_id].rules.filter(e => e.source !== src);
            Patterns._set_basic(e);
        };
        Patterns.set_env = function (env_id) {
            current_env_id = env_id;
            localStorage.setItem('env', env_id);
        };
        Patterns.get_all = function () {
            const result = [];
            const object = Patterns._get_basic();
            for (const key in object) {
                if (object.hasOwnProperty(key)) {
                    result.push(`==${key}==`);
                    object[key].rules.forEach(e => result.push(e.source));
                }
            }
            return result;
        };
        Patterns.count_per_env = function (env_id) {
            return Patterns._get_basic()[env_id].rules.length;
        };
        Patterns.count_all_env = function () {
            return Patterns.get_env_ids().map(env_id => Patterns.count_per_env(env_id)).reduce((a, b) => a + b, 0);
        };
        Patterns.get_env_ids = function () {
            const result = [];
            const object = Patterns._get_basic();
            for (const key in object) {
                if (object.hasOwnProperty(key)) {
                    result.push(key);
                }
            }
            return result;
        };
        Patterns.parse_env = function (list) {
            const env_head = new RegExp('^==(.+)==$');
            let current = 'main';
            const environments = {};
            const inherit_wait = [];
            environments[current] = {};
            let temp = [];
            for (let line of list) {
                line = line.trim();
                var regexparray;
                if (regexparray = env_head.exec(line)) {
                    environments[current].rules = temp;
                    temp = [];
                    current = regexparray[1];
                    environments[current] = {
                        rules: [],
                        inherits: [],
                    };
                    // inherit
                    const m = current.match(/\((.*)\)$/);
                    if (m && m[1]) environments[current].inherits = m[1].split(',');
                } else {
                    if (line) temp.push(new Rule(line));
                }
            }
            environments[current].rules = temp;
            inherit_wait.forEach(e => e());
            return environments;
        };

        { //互換性
            const old_rule = GM_getValue('rules');
            if (old_rule) {
                const e = Patterns._get_basic();
                e['main'].rules = old_rule;
                Patterns._set_basic(e);
                GM_setValue('rules', []);
            }
        }
        return Patterns;
    })();


    const Rule = (function () {
        const Rule = function (str) {
            this.source = str;
            if (str.startsWith('#')) {
                str = `$inurl('${str.substring(1).replace('\'','\\\'')}','')`;
            }
            if (this.iscomment = str.startsWith('!')) return;
            const index = str.indexOf('$');
            var pair;
            if (index === -1) {
                pair = [str, null];
            } else {
                pair = [str.substring(0, index), str.substring(index + 1)];
            }
            this.domain_length = pair[0].length;
            this.domain = this.domain_length ? pair[0] : null;
            if (this.command = pair[1] || null)
                this.command_function = eval(this.command);
        };
        Rule.prototype.make_command_function = function () {
            if (this.command) {
                try {
                    this.command_function = eval(this.command);
                } catch (error) {
                    console.log(error);
                }
            }
        };
        const not = function (fn) {
            return (function (...args) {
                return !fn(...args);
            });
        };
        const and = function (...fns) {
            return (function (...args) {
                for (const fn of fns)
                    if (!fn(...args))
                        return false;
                return true;
            });
        };
        const or = function (...fns) {
            return (function (...args) {
                for (const fn of fns)
                    if (fn(...args))
                        return true;
                return false;
            });
        };
        const nor = function (...fns) {
            return not(or(...fns));
        };
        const nand = function (...fns) {
            return not(and(...fns));
        };
        const xor = function (...fns) {
            return (function (...args) {
                return fns.reduce((a, b) => b(...args) ? !a : a, false);
            });
        };
        Rule.prototype.match = function (element, url, domain = null, domain_length = null, url_obj = null) {
            if (!(domain && domain_length && url_obj)) {
                url_obj = new URL(url);
                domain = url_obj.host;
                domain_length = domain.length;
            }
            if (this.iscomment) {
                return false;
            } else {
                return this.match_domain(domain, domain_length) && this.commands(element, url, url_obj);
            }
        };
        Rule.prototype.match_domain = function (domain, domain_length) {
            return !this.domain || domain.endsWith(this.domain) && (this.domain_length === domain_length || domain.charAt(domain_length - this.domain_length - 1) === '.');
        };

        const intitle = function (...args) {
            if (args[1] || args[1] === '')
                var re = new RegExp(...args);
            return (function (element, url, url_obj) {
                const title = element.querySelector(SETTINGS.title);
                if (title) {
                    if (re) {
                        return re.test(title.textContent);
                    } else {
                        return !!~title.textContent.indexOf(...args);
                    }
                } else {
                    return false;
                }
            });
        };
        const inbody = function (...args) {
            if (args[1] || args[1] === '')
                var re = new RegExp(...args);
            return (function (element, url, url_obj) {
                const body = element.querySelector(SETTINGS.body);
                if (body) {
                    if (re) {
                        return re.test(body.textContent);
                    } else {
                        return !!~body.textContent.indexOf(...args);
                    }
                } else {
                    return false;
                }
            });
        };
        const intext = function (...args) {
            const intitle_ = intitle(...args);
            const inbody_ = inbody(...args);
            return (function (element, url, url_obj) {
                return intitle_(element, url) || inbody_(element, url);
            });
        };
        const inurl = function (...args) {
            if (args[1] || args[1] === '')
                var re = new RegExp(...args);
            return (function (element, url, url_obj) {
                if (re) {
                    return re.test(url);
                } else {
                    return !!~url.indexOf(...args);
                }
            });
        };
        // $$ = element, $ = url
        const script = function (...args) {
            return (function ($$, $) {
                return !args[0] || !!eval(args[0]);
            });
        };
        const prefix = function (...args) {
            return (function (element, url, url_obj) {
                return url_obj.pathname.startsWith(...args);
            });
        };
        const suffix = function (...args) {
            return (function (element, url, url_obj) {
                return url_obj.pathname.endsWith(...args);
            });
        };
        const domain = function (...args) {
            return (function (element, url, url_obj) {
                const domain = url_obj.host,
                    domain_length = domain.length,
                    rule_domain = args[0],
                    rule_domain_length = rule_domain.length;
                return domain.endsWith(args[0]) && (rule_domain_length === domain_length ||
                    domain.charAt(domain_length - rule_domain_length - 1) === '.');
            });
        };
        const domainp = function (...args) {
            return (function (element, url, url_obj) {
                return url_obj.host.startsWith(...args);
            });
        };
        const domains = function (...args) {
            return (function (element, url, url_obj) {
                return url_obj.host.endsWith(...args);
            });
        };
        const indomain = function (...args) {
            if (args[1] || args[1] === '')
                var re = new RegExp(...args);
            return (function (element, url, url_obj) {
                if (re) {
                    return re.test(url_obj.host);
                } else {
                    return ~url_obj.host.indexOf(args[0]);
                }
            });
        };
        Rule.prototype.commands = function (element, url, url_obj) {
            try {
                if (this.iscomment) {
                    return false;
                } else {
                    return !this.command || this.command_function(element, url, url_obj);
                }
            } catch (error) {
                console.log(error);
            }
        };
        return Rule;
    })();

    const FindElement = (function () {
        const FindElement = {};
        FindElement.is_element_of_AND = function (element, props = {
            id: '',
            classList: [],
            attrs: {},
            tagName: '',
        }) {
            return (!props.id || element.id === props.id) &&
                (!props.tagName || element.tagName.toLowerCase() === props.tagName.toLowerCase()) &&
                (!(props.classList && (props.classList instanceof Array) && props.classList.length) ||
                    props.classList.filter(e => !element.classList.contains(e)).length === 0) &&
                (!(props.attrs && props.attrs instanceof Object) ||
                    Object.keys(props.attrs).filter(e => element.getAttribute(e) !== props.attrs[e]).length ===
                    0);
        };
        FindElement.has_ancestor_of = function (element, props) {
            while (element = element.parentElement)
                if (FindElement.is_element_of_AND(element, props)) return true;
            return false;
        };
        FindElement.is_exclude = function (element) {
            const excludes = SETTINGS.excludes;
            if (excludes) {
                for (const key in excludes) {
                    if (excludes.hasOwnProperty(key)) {
                        if (FindElement[key](element, excludes[key])) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        return FindElement;
    })();


    //main class for blocking search result.
    const GoogleSearchBlock = (function () {
        const GoogleSearchBlock = {};
        GoogleSearchBlock.controllers = [];

        let blocked_patterns_ = [];
        let time = 0;

        GoogleSearchBlock.getMatchRules = function (e) {
            const result = [];
            const link_ = e.querySelector(SETTINGS.second);
            if (!link_) return result;
            const url_ = link_.getAttribute('href');
            if (!url_.startsWith('http')) return result;
            const url_obj = new URL(url_);
            const domain = url_obj.host;
            const domain_length = domain.length;
            for (const rule of BLOCK) {
                if (rule.match(e, url_, domain, domain_length, url_obj))
                    result.push(rule);
            }
            return result;
        };

        GoogleSearchBlock.one = function (e, second_selector) {
            if (FindElement.is_exclude(e)) return false;
            const start_ = performance.now();
            // const link_ = e.querySelector('a');
            const link_ = e.querySelector(second_selector || SETTINGS.second);
            let removed_ = false;
            if (link_) {
                const fragment = document.createDocumentFragment();
                e.style['background-color'] = '';
                e.blocked = e.isredisplay = false;
                const url_ = link_.getAttribute('href');
                if (!url_.startsWith('http')) return;
                const url_obj = new URL(url_);
                const domain = url_obj.host;
                const domain_length = domain.length;
                for (let i = 0, len = BLOCK.length; i < len; i++) {
                    const block_pattern_ = BLOCK[i].source;
                    if (BLOCK[i].match(e, url_, domain, domain_length, url_obj)) {
                        e.blocked = true;
                        e.style.display = 'none';
                        e.style['background-color'] = 'rgba(248, 195, 199, 0.884)';
                        removed_ = block_pattern_;
                        if (!~blocked_patterns_.indexOf(block_pattern_)) {
                            blocked_patterns_.push(block_pattern_);
                            if (R.blocked) GoogleSearchBlock.createButton(block_pattern_, fragment);
                        }
                        COUNT++;
                        if (R.count) R.count.textContent = COUNT;
                        break;
                    }
                }
                if (R.blocked) R.blocked.appendChild(fragment);
                if (!removed_) e.style.display = 'block';

                const controller = new Controller(e, url_);
                GoogleSearchBlock.controllers.push(controller);
                controller.createButton();
            }
            time += performance.now() - start_;
            return removed_;
        };


        GoogleSearchBlock.all = function (aggregate = true) {
            const start_ = performance.now();
            GoogleSearchBlock.controllers = [];
            let count_ = 0;
            blocked_patterns_ = [];
            COUNT = 0;
            // document.querySelectorAll(SETTINGS.first)
            const l = [];
            if (SETTINGS.targets) {
                SETTINGS.targets.forEach(t => {
                    document.querySelectorAll(t.first).forEach(e => {
                        l.push({
                            element: e,
                            target: t
                        });
                    });
                });
            }
            l.forEach(e => {
                if (GoogleSearchBlock.one(e.element, e.target.second)) count_++;
            });
            COUNT = count_;
            // console.log('all', count_);
            time = performance.now() - start_;
            if (aggregate)
                GoogleSearchBlock.aggregate();
        };

        GoogleSearchBlock.aggregate = function () {
            while (R.blocked.firstChild) R.blocked.removeChild(R.blocked.firstChild);
            //blocked buttons
            const fragment = document.createDocumentFragment();
            Util.distinct(blocked_patterns_).sort().forEach(e => {
                GoogleSearchBlock.createButton(e, fragment);
            });
            R.blocked.appendChild(fragment);
            R.button_show.style.display = 'block';
            R.button_reblock.style.display = 'none';
            R.count.textContent = COUNT;
            R.textarea_domains.value = Patterns.get_all().join('\n');
            R.info.textContent = `${Math.floor(time*10)/10}ms ${BLOCK.length}`;
            Form.create_env_options(Patterns.get_env_ids());
            R.select.value = Patterns.get_current_env_id();
        };

        const element = document.createElement('span');
        element.innerHTML = TextResource.get('button_blocked_rule');
        element.className = 'google_search_block_button google_search_block_button2';
        element.setAttribute('oncontextmenu', 'return false;');

        GoogleSearchBlock.createButton = function (pattern, fragment) {
            const span = element.cloneNode(true);
            span.setAttribute('domain', pattern);
            span.addEventListener('click', GoogleSearchBlock.deleterule);

            const R_ = {
                commentout: span.querySelector('.google_search_block_button_selector_commentout'),
                redisplay: span.querySelector('.google_search_block_button_selector_redisplay'),
                code: span.querySelector('code'),
                selectors: span.querySelector('.google_search_block_button_selectors'),
            };

            R_.code.textContent = pattern;
            R_.commentout.setAttribute('domain', pattern);
            R_.commentout.addEventListener('click', GoogleSearchBlock.commentout);
            R_.redisplay.setAttribute('domain', pattern);
            R_.redisplay.addEventListener('click', GoogleSearchBlock.redisplay);

            fragment.appendChild(span);
        };

        GoogleSearchBlock.deleterule = function (e) {
            var domain = this.getAttribute('domain');
            Patterns.remove(domain);
            BLOCK = Patterns.get();
            GoogleSearchBlock.all();
            SYNC.initSync().then(() => SYNC.push()).catch(() => {
                SYNC.setModifiedTime(Date.now());
            });
            e.stopPropagation();
        };
        GoogleSearchBlock.commentout = function (e) {
            var domain = this.getAttribute('domain');
            Patterns.remove(domain);
            Patterns.add('!' + domain);
            BLOCK = Patterns.get();
            GoogleSearchBlock.all();
            SYNC.initSync().then(() => SYNC.push()).catch(() => {
                SYNC.setModifiedTime(Date.now());
            });
            e.stopPropagation();
        };
        GoogleSearchBlock.redisplay = function (event) {
            var domain = this.getAttribute('domain');
            const rule = new Rule(domain);
            document.querySelectorAll(SETTINGS.first).forEach(e => {
                var link_, url_;
                if ((link_ = e.querySelector(SETTINGS.second)) &&
                    (url_ = link_.getAttribute('href')) &&
                    url_.startsWith('http') && rule.match(e, url_)) {
                    if (event.target.redisplayed) {
                        e.isredisplay = event.target.redisplayed = false;
                        e.style.display = 'none';
                        event.target.textContent = 'D';
                    } else {
                        e.isredisplay = event.target.redisplayed = true;
                        e.style.display = 'block';
                        event.target.textContent = 'B';
                    }
                    return;
                }
            });
            event.stopPropagation();
        };
        return GoogleSearchBlock;
    })();


    const Form = (function () {
        const Form = {};
        //initialize form (bottom of the page)
        Form.init = function (container) {
            const e = document.createElement('div');
            e.innerHTML = TextResource.get('form');
            e.addEventListener('click', function (e) {
                e.stopPropagation();
            });
            container.appendChild(e);

            R.form = document.querySelector('#google_search_block');
            Object.assign(R, {
                button_showlist: R.form.querySelector('#google_search_block_button_showlist'),
                count: R.form.querySelector('#google_search_block_count'),
                button_reblock: R.form.querySelector('#google_search_block_button_reblock'),
                button_show: R.form.querySelector('#google_search_block_button_show'),
                button_hidelist: R.form.querySelector('#google_search_block_button_hidelist'),
                button_complete: R.form.querySelector('#google_search_block_button_complete'),
                button_edit: R.form.querySelector('#google_search_block_button_edit'),
                contents: R.form.querySelector('#google_search_block_contents'),
                textarea_domains: R.form.querySelector('#google_search_block_textarea_domains'),
                blocked: R.form.querySelector('#google_search_block_blocked'),
                info: R.form.querySelector('#google_search_block_info'),
                signin: R.form.querySelector('#google_search_block_button_signin'),
                signout: R.form.querySelector('#google_search_block_button_signout'),
                syncinfo: R.form.querySelector('#google_search_block_button_syncinfo'),
                modal: R.form.querySelector('#google_search_block_modal'),
                select: R.form.querySelector('#google_search_block_select_env'),
            });
            R.form.classList.add(...SETTINGS.container_class.split(' '));
            R.button_complete.addEventListener('click', function () {
                R.textarea_domains.disabled = true;
                R.textarea_domains.style.overflow = 'hidden';
                const list_ = Util.distinct(R.textarea_domains.value.split('\n').map(e => e.trim()).filter(e => e));
                Patterns.set(list_);
                BLOCK = Patterns.get();
                GoogleSearchBlock.all();
                SYNC.initSync().then(() => SYNC.push()).catch(() => {
                    SYNC.setModifiedTime(Date.now());
                });
            });
            R.button_edit.addEventListener('click', function () {
                R.textarea_domains.disabled = false;
                R.textarea_domains.style.overflow = 'unset';
            });
            R.button_show.addEventListener('click', function () {
                document.querySelectorAll(SETTINGS.first).forEach(e => {
                    e.isredisplay = true;
                    e.style.display = 'block';
                });
                R.button_reblock.style.display = 'block';
                R.button_show.style.display = 'none';
            });
            R.button_reblock.addEventListener('click', function () {
                GoogleSearchBlock.all();
                R.button_reblock.style.display = 'none';
                R.button_show.style.display = 'block';
            });
            R.button_hidelist.addEventListener('click', Form.close_list);
            R.button_showlist.addEventListener('click', Form.open_list);
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
            R.modal.addEventListener('change', function () {
                Modal.set(this.checked);
                location.reload();
            });
            R.select.addEventListener('change', function () {
                const value = this.value;
                Patterns.set_env(value);
                BLOCK = Patterns.get();
                GoogleSearchBlock.all();
                this.value = value;
            });
            R.select.value = Patterns.get_current_env_id();
            R.modal.checked = Modal.get();
            R.textarea_domains.disabled = true;
        };
        Form.open_list = function () {
            R.button_showlist.style.display = 'none';
            R.button_hidelist.style.display = 'block';
            R.contents.style.display = 'block';
            R.textarea_domains.value = Patterns.get_all().join('\n');
            Form.create_env_options(Patterns.get_env_ids());
            R.select.value = Patterns.get_current_env_id();
        };
        Form.close_list = function () {
            R.button_showlist.style.display = 'block';
            R.button_hidelist.style.display = 'none';
            R.contents.style.display = 'none';
        };
        Form.create_env_options = function (envs) {
            while (R.select.firstElementChild) R.select.firstElementChild.remove();
            envs.forEach(e => {
                const option = document.createElement('option');
                option.textContent = e;
                option.value = e;
                R.select.appendChild(option);
            });
        };
        return Form;
    })();


    const Modal = (function () {
        const Modal = {};

        Modal.init = function () {
            document.body.insertAdjacentHTML('beforeEnd', TextResource.get('modal'));
            Modal.button_open = document.querySelector('#google_search_block_modal_button_open');
            Modal.button_close = document.querySelector('#google_search_block_modal_button_close');
            Modal.container = document.querySelector('#google_search_block_modal_container');
            Modal.button_open.addEventListener('click', Modal.open);
            Modal.button_close.addEventListener('click', Modal.close);
            Modal.container.addEventListener('click', function () {
                Modal.button_open.style.display = 'block';
                Modal.button_close.style.display = 'none';
                Modal.container.style.display = 'none';
            });
        };
        Modal.getContainer = function () {
            return Modal.container;
        };
        Modal.set = function (bool) {
            GM_setValue('modal', (+bool).toString());
        };
        Modal.get = function () {
            return !!parseInt(GM_getValue('modal', '0'));
        };
        Modal.open = function () {
            Form.open_list();
            Modal.button_close.style.display = 'block';
            Modal.button_open.style.display = 'none';
            Modal.container.style.display = 'flex';
            Modal.isopen = true;
        };
        Modal.close = function () {
            Form.close_list();
            Modal.button_open.style.display = 'block';
            Modal.button_close.style.display = 'none';
            Modal.container.style.display = 'none';
            Modal.isopen = false;
        };
        Modal.isopen = false;
        return Modal;
    })();

    //select function for observer by environment
    function getObserverFunction(target) {
        const walkAddedNodesInRecords = function (compare) {
            return (function (...args) {
                return (function (records, callback) {
                    for (const record of records) {
                        for (const node of record.addedNodes) {
                            if (compare(node, ...args)) {
                                callback(node);
                            }
                        }
                    }
                });
            });
        };
        const observer_functions = {
            containsInClassListWhenAdded: walkAddedNodesInRecords((node, classname) => node instanceof Element && node.classList.contains(classname)),
            parentClassContains: walkAddedNodesInRecords((node, classname) => node instanceof Element && node.parentElement && node.parentElement.classList.contains(classname)),
            equalsClassNameWhenAdded: walkAddedNodesInRecords((node, classname) => node instanceof Element && node.className === classname),
            firstChildElementIs: walkAddedNodesInRecords((node, firstchildtagname) => node instanceof Element && node.firstElementChild && node.firstElementChild.tagName === firstchildtagname),
            hasAttribute: walkAddedNodesInRecords((node, attribute_name, value) => node instanceof Element && ('hasAttribute' in node) && (value ? node.getAttribute(attribute_name) === value : node.hasAttribute(attribute_name))),
        };
        return observer_functions[target.observer_function](...target.observer_fn_arguments);
    }
    //initializer
    function init() {
        unsafeWindow.GoogleSearchBlock = GoogleSearchBlock;
        unsafeWindow.Patterns = Patterns;
        let environment_ = null;

        { //detect environment
            const isMobile_ = Util.isMobileDevice();
            if (location.host === 'www.google.com' ||
                location.host === 'www.google.co.jp') {
                if (Util.getUrlParams(location.href).tbm) {
                    console.warn('this page is not a search result page.')
                    return;
                }
                environment_ = isMobile_ ? 'google_mobile' : 'google_pc';
            } else if (location.host === 'www.bing.com') {
                environment_ = isMobile_ ? "bing_mobile" : 'bing_pc';
            } else if (location.host === 'search.yahoo.co.jp') {
                environment_ = isMobile_ ? 'yahoo_co_jp_mobile' : "yahoo_co_jp_pc";
            }
            console.log('environment:', environment_);
        }

        { //load settings
            if (!(SETTINGS = JSON.parse(TextResource.get('environments'))[environment_])) {
                console.error('no settings');
                return;
            }
        }

        // import from tools
        unsafeWindow.google_search_blocker_import = function (imports) {
            try {
                imports.forEach(e => Patterns.add(e));
                BLOCK = Patterns.get();
                GM_setValue('modified', Date.now().toString());
                console.log(`%cimported ${imports.length} rules`, `color:${Colors.Purple}`);
                return true;
            } catch (error) {
                console.error('failed to import', error);
                return false;
            }
        };

        //if there are any elements before observe, block these elements.
        console.log(document.querySelectorAll(SETTINGS.first).length + ' elements was found before start MutationObserver');
        GoogleSearchBlock.all(false);

        //use MutationObserver from document-start
        const mutation_processed_ = [];
        SETTINGS.targets.forEach(target => {
            if (target.observer_function) {
                const onMutated = getObserverFunction(target);
                const observer_ = new MutationObserver(function (records) {
                    onMutated(records, (element) => {
                        if (!~mutation_processed_.indexOf(element)) {
                            GoogleSearchBlock.one(element, target.second);
                            mutation_processed_.push(element);
                        }
                    });
                });
                observer_.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });
            }
        });

        window.addEventListener('DOMContentLoaded', function () {
            console.log('%c----------DOMContentLoaded----------', `color:${Colors.LightBlue};`);

            //check if ...
            if (!(R.result_container = document.querySelector(SETTINGS.result_container))) {
                console.error('result container not found.');
                return;
            }

            COUNT = 0;
            if (Modal.get()) {
                Modal.init();
                Form.init(Modal.getContainer());

                { //key bindings
                    document.addEventListener('keydown', function (e) {
                        if (e.altKey && e.which === 13) {
                            Modal.isopen ? Modal.close() : Modal.open();
                        }
                    });
                }

            } else {
                Form.init(R.result_container);
            }
            GoogleSearchBlock.all();

            { //google mobile ajax load.
                if (environment_ === 'google_mobile') {
                    const observer_ = new MutationObserver(function (records) {
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

        });

        window.addEventListener('load', function () {
            console.log('%c----------------load----------------', `color:${Colors.LightGreen};`);

            GoogleSearchBlock.all();

            Element.prototype.insertBefore = Element_prototype_insertBefore;
            Element.prototype.appendChild = Element_prototype_appendChild;

            //initialize sync feature.
            (SYNC = new DriveSync(CLIENT_ID, LIST_FILE_NAME, (time) => {
                GM_setValue('modified', time.toString());
            }, () => {
                return parseInt(GM_getValue('modified', '0'));
            }, data => {
                Patterns.set_json(data);
                BLOCK = Patterns.get();
                console.log('%cDOWNLOAD', `color:${Colors.Pink};`, BLOCK.length);
                GoogleSearchBlock.all();
            }, () => {
                const patterns = Patterns._get_basic();
                console.log('%cUPLOAD', `color:${Colors.Blue};`, Patterns.count_all_env());
                return JSON.stringify(patterns);
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
            })).initSync().then(() => SYNC.compare()).catch(() => {
                SYNC.setUseSync(false);
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
    let BLOCK = Util.distinct(Patterns.get(), e => e.source);

    init();

})();