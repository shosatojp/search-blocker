// ==UserScript==
// @name         Google Search Blocker
// @namespace    https://github.com/ShoSatoJp/
// @version      0.9.33
// @description  block undesired sites from google search results!
// @author       ShoSato
// @match https://www.google.co.jp/search?*
// @match https://www.google.com/search?*
// @match https://www.bing.com/*
// @match https://search.yahoo.co.jp/*
// @resource label https://raw.githubusercontent.com/ShoSatoJp/google_search_blocker/master/container.html?
// @resource buttons https://raw.githubusercontent.com/ShoSatoJp/google_search_blocker/master/buttons.html?
// @resource selectors https://raw.githubusercontent.com/ShoSatoJp/google_search_blocker/master/selectors.html?
// @resource environments https://raw.githubusercontent.com/ShoSatoJp/google_search_blocker/master/environments.json?
// @resource languages https://raw.githubusercontent.com/ShoSatoJp/google_search_blocker/master/languages.json?
// @updateURL https://raw.githubusercontent.com/ShoSatoJp/google_search_blocker/master/google_search_blocker.user.js?
// @downloadURL https://raw.githubusercontent.com/ShoSatoJp/google_search_blocker/master/google_search_blocker.user.js?
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_getResourceText
// ==/UserScript==

(function () {
    'use strict';
    const CLIENT_ID = '531665009269-96fvecl3pj4717mj2e6if6oaph7eu8ar.apps.googleusercontent.com';
    const LIST_FILE_NAME = 'GoogleSearchBlocker.txt';

    var google_search_block_label;
    var google_search_block_button_showlist;
    var google_search_block_count;
    var google_search_block_button_reblock;
    var google_search_block_button_show;
    var google_search_block_button_hidelist;
    var google_search_block_button_complete;
    var google_search_block_button_edit;
    var google_search_block_contents;
    var google_search_block_textarea_domains;
    var google_search_block_blocked;
    var google_search_block_info;
    var google_search_block_do_sync;
    var google_search_block_button_auth;
    var language = (window.navigator.languages && window.navigator.languages[0]) ||
        window.navigator.language ||
        window.navigator.userLanguage ||
        window.navigator.browserLanguage;

    function timer(f, msg = '') {
        const s = Date.now();
        f();
        console.log(msg, Date.now() - s);
    }

    var resource = {};

    function getResource(name) {
        if (!(name in resource)) {
            let src = GM_getResourceText(name);
            let obj = JSON.parse(GM_getResourceText('languages'))
                .filter(x => ~x.language.indexOf(language.toLowerCase()) || ~x.language.indexOf('en'))[0].ui; //english must be last.
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    src = src.replace('${' + key + '}', obj[key]);
                }
            }
            resource[name] = src;
        }
        return resource[name];
    }

    function parseURL(url) {
        var parser = document.createElement('a'),
            searchObject = {},
            queries, split, i;
        parser.href = url;
        queries = parser.search.replace(/^\?/, '').split('&');
        for (i = 0; i < queries.length; i++) {
            split = queries[i].split('=');
            searchObject[split[0]] = split[1];
        }
        return {
            protocol: parser.protocol,
            host: parser.host,
            hostname: parser.hostname,
            port: parser.port,
            pathname: parser.pathname,
            search: parser.search,
            searchObject: searchObject,
            hash: parser.hash
        };
    }

    function getDomains() {
        return GM_getValue('url', '').split(';').filter(e => e);
    }

    function setDomains(domains) {
        GM_setValue('url', domains.join(';'));
    }

    function addDomain(url, isurl = true) {
        let domain = isurl ? parseURL(url).host : url;
        let list = getDomains();
        if (domain && !~list.indexOf(domain)) {
            list.push(domain);
        }
        GM_setValue('url', list.join(';'));
        block = getDomains()
        google_search_block();
    }

    function removeDomain(domain, changeui = true) {
        let list = getDomains();
        let newlist = list.filter(e => e != domain);
        GM_setValue('url', newlist.join(';'));
        block = getDomains();
        changeui && google_search_block();
    }

    function updateLabel(count, list) {
        google_search_block_count.textContent = count;
        showList(list);
    }

    function showLabel() {
        const html = getResource("label");
        const e = document.createElement('div');
        const s = Date.now();
        e.innerHTML = html;
        console.log('showlabel', Date.now() - s);
        result_container.appendChild(e);

        google_search_block_label = document.querySelector('#google_search_block');
        google_search_block_button_showlist = google_search_block_label.querySelector('#google_search_block_button_showlist');
        google_search_block_count = google_search_block_label.querySelector('#google_search_block_count');
        google_search_block_button_reblock = google_search_block_label.querySelector('#google_search_block_button_reblock');
        google_search_block_button_show = google_search_block_label.querySelector('#google_search_block_button_show');
        google_search_block_button_hidelist = google_search_block_label.querySelector('#google_search_block_button_hidelist');
        google_search_block_button_complete = google_search_block_label.querySelector('#google_search_block_button_complete');
        google_search_block_button_edit = google_search_block_label.querySelector('#google_search_block_button_edit');
        google_search_block_contents = google_search_block_label.querySelector('#google_search_block_contents');
        google_search_block_textarea_domains = google_search_block_label.querySelector('#google_search_block_textarea_domains');
        google_search_block_blocked = google_search_block_label.querySelector('#google_search_block_blocked');
        google_search_block_info = google_search_block_label.querySelector('#google_search_block_info');
        google_search_block_do_sync = google_search_block_label.querySelector('#google_search_block_do_sync');
        google_search_block_button_auth = google_search_block_label.querySelector('#google_search_block_button_auth');
        google_search_block_do_sync.addEventListener('input', function (e) {
            GM_setValue('do_sync', (+e.target.checked).toString());
            if (e.target.checked) {
                initSync();
                doUpdateListFile();
            }
        });

        if (!!parseInt(GM_getValue('do_sync', '0'))) {
            google_search_block_do_sync.checked = true;
            initSync();
            doUpdateListFile();
        }

        google_search_block_label.classList.add(...SETTINGS.container_class.split(' '));
        google_search_block_button_complete.addEventListener('click', function () {
            google_search_block_textarea_domains.disabled = true;
            let list = orderBy(distinct(google_search_block_textarea_domains.value.split('\n').map(e => e.trim()).filter(e => e)).map(e => {
                if (e.startsWith('#')) return {
                    v: e,
                    l: 1000
                }
                else return {
                    v: e,
                    l: e.length
                }
            }), e => e.l).map(e => e.v);
            setDomains(list);
            block = getDomains();
            google_search_block();
            if (!!parseInt(GM_getValue('do_sync', '0'))) {
                doUpdateListFile();
            }
        });
        google_search_block_button_edit.addEventListener('click', function () {
            google_search_block_textarea_domains.disabled = false;
        });
        google_search_block_button_show.addEventListener('click', function () {
            document.querySelectorAll(SETTINGS.first).forEach(e => e.style.display = 'block');
            google_search_block_button_reblock.style.display = 'block';
            google_search_block_button_show.style.display = 'none';
        });
        google_search_block_button_reblock.addEventListener('click', function () {
            google_search_block();
            google_search_block_button_reblock.style.display = 'none';
            google_search_block_button_show.style.display = 'block';
        });
        google_search_block_button_hidelist.addEventListener('click', function () {
            google_search_block_button_showlist.style.display = 'block';
            google_search_block_button_hidelist.style.display = 'none';
            google_search_block_contents.style.display = 'none';
        });
        google_search_block_button_showlist.addEventListener('click', function () {
            google_search_block_button_showlist.style.display = 'none';
            google_search_block_button_hidelist.style.display = 'block';
            google_search_block_contents.style.display = 'block';
            showList(getDomains());
        });
        google_search_block_textarea_domains.disabled = true;
    }

    function showList(list) {
        google_search_block_textarea_domains.value = list.sort().join('\n');
    }

    function regex_escape(src) {
        const escapes = '\\*{}[]()^$.+|?';
        escapes.split('').forEach(e => src = src.replace(new RegExp(`\\${e}`, 'gi'), `\\${e}`));
        return src;
    }

    function getCandidate(url) {
        let c = parseURL(url);
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
        var temp = '#https?://' + regex_escape(c.host);
        var temp_alias = c.host;
        split.pop();
        split.slice(0, 2).forEach(e => {
            temp += '/' + regex_escape(e);
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
        div.innerHTML = getResource('selectors');
        getCandidate(target_url).forEach(e => {
            const span = document.createElement('span');
            span.className = 'google_search_block_button';
            span.setAttribute('url', e.regex);
            span.addEventListener('click', function () {
                const url = this.getAttribute('url');
                addDomain(url, false);
                div.remove();
                if (SETTINGS.result_box_style_class) {
                    parent.classList.remove(SETTINGS.result_box_style_class);
                }
            });
            span.style.display = 'inline';
            const code = document.createElement('code');
            code.textContent = e.alias;
            span.appendChild(code);
            div.querySelector('.google_search_block_blockui_contents').appendChild(span);
        });
        parent.appendChild(div);
    }

    function showButton(parent, target_url) {

        var label = parent.querySelector('.google_search_block_buttons_container');
        if (!label) {
            let container = document.createElement('div');
            container.className = 'google_search_block_buttons_container';
            container.innerHTML = getResource('buttons');
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
        const start = performance.now();
        count = 0;
        let blocked = [];
        timer(() => {
            document.querySelectorAll(SETTINGS.first).forEach(e => {
                const link = e.querySelector(SETTINGS.second);
                if (link) {
                    e.style['background-color'] = '';
                    let removed = false;
                    var url = link.getAttribute('href');
                    const host = parseURL(url).host;
                    for (let i = 0, len = block.length; i < len; i++) {
                        const b = block[i];
                        if (b.charAt(0) === '#' ? url.match(new RegExp(b.substr(1), 'g')) : host.endsWith(b)) {
                            e.style.display = 'none';
                            e.style['background-color'] = 'rgba(248, 195, 199, 0.884)';
                            removed = true;
                            blocked.push(b);
                            count++;
                            break;
                        }
                    }
                    if (!removed) e.style.display = 'block';
                    showButton(e, url);
                }
            });
        }, '1');

        while (google_search_block_blocked.firstChild) google_search_block_blocked.removeChild(google_search_block_blocked.firstChild);
        distinct(blocked).sort().forEach(e => {
            const span = document.createElement('span');
            span.addEventListener('click', function () {
                var domain = this.getAttribute('domain');
                removeDomain(domain);
            });
            span.className = 'google_search_block_button';
            span.setAttribute('domain', e);
            const code = document.createElement('code');
            code.textContent = e;
            span.appendChild(code);
            google_search_block_blocked.appendChild(span);
        });
        updateLabel(count, getDomains());
        google_search_block_info.textContent = `${Math.floor((performance.now() - start)*10)/10}ms ${block.length}`;
    }

    function distinct(list, f = e => e) {
        var temp = list.map(x => f(x));
        return list.filter((value, index, self) => {
            return temp.indexOf(f(value)) === index;
        });
    }

    function orderBy(list, ...fn) {
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
    }

    const start = Date.now();
    let block = distinct(getDomains());
    let count = 0;
    let environment = null;
    if (location.host === 'www.google.com' || location.host === 'www.google.co.jp') {
        environment = document.querySelector('#search') ? 'pc' : 'mobile';
    } else if (location.host === 'www.bing.com') {
        environment = document.querySelector('[name="mobileoptimized"]') ? "bing_mobile" : 'bing_pc';
    } else if (location.host === 'search.yahoo.co.jp') {
        environment = document.querySelector('#WS2m') ? "yahoo_pc" : 'yahoo_mobile';
    }
    console.log(environment);
    let xpdcount = 0;
    const settings = JSON.parse(GM_getResourceText('environments'));
    var SETTINGS;
    settings.forEach(e => {
        if (e.environment === environment) {
            SETTINGS = e;
        }
    });
    const result_container = document.querySelector(SETTINGS.result_container);
    if (!result_container) return;

    if (environment === 'mobile') {
        const observer = new MutationObserver(function (records, mo) {
            if (records.filter(x => {
                    return ('getAttribute' in x.target) && x.target.getAttribute('data-graft-type') === 'insert';
                }).length) {
                google_search_block();
            }
        });
        observer.observe(document.querySelector(SETTINGS.observer_target), {
            attributes: true,
            childList: true,
            characterData: true,
            attributeFilter: [],
            subtree: true
        });
    }
    showLabel();
    google_search_block();
    console.log(Date.now() - start);


    // sync


    function authenticate() {
        return gapi.auth2.getAuthInstance()
            .signIn({
                scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file"
            })
            .then(function () {
                    console.log("Sign-in successful");
                },
                function (err) {
                    console.error("Error signing in", err);
                });
    }

    function loadClient() {
        return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/drive/v3/rest")
            .then(function () {
                    console.log("GAPI client loaded for API");
                },
                function (err) {
                    console.error("Error loading GAPI client for API", err);
                });
    }

    async function createFile(name) {
        return gapi.client.drive.files.create({
            "resource": {
                "name": name
            }
        }).then(function (response) {
            // console.log('created', response.result)
            return response.result;
        }, function (err) {
            console.error("Execute error", err);
            return null;
        });
    }

    async function findFile(name) {
        return gapi.client.drive.files.list({
            "q": `name='${name}'`
        }).then(function (response) {
            return response.result.files[0];
        }, function (err) {
            console.log(err);
            return null;
        });
    }

    async function updateFileContent(id, content) {
        return new Promise((res, rej) => {
            const auth_token = gapi.auth.getToken().access_token;
            const boundary = "-------314159265358979323846";
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const metadata = {
                mimeType: "text/plain"
            };

            const multipartRequestBody =
                delimiter +
                "Content-Type: application/json\r\n\r\n" +
                JSON.stringify(metadata) +
                delimiter +
                "Content-Type: application/json\r\n\r\n" +
                content +
                close_delim;

            gapi.client
                .request({
                    path: "/upload/drive/v3/files/" + id,
                    method: "PATCH",
                    params: {
                        fileId: id,
                        uploadType: "multipart"
                    },
                    headers: {
                        "Content-Type": 'multipart/form-data; boundary="' + boundary + '"',
                        Authorization: "Bearer " + auth_token
                    },
                    body: multipartRequestBody
                })
                .execute(function (file) {
                    res(file);
                });
        });
    }

    async function getFileContent(id) {
        return gapi.client.drive.files.get({
            fileId: id,
            alt: "media"
        }).then(response => {
            // console.log('body', response);
            return response.body;
        }).catch(reason => {
            return null;
        });
    }

    async function getMetadata(id) {
        return gapi.client.drive.files.get({
            fileId: id,
            fields: 'modifiedTime',
        }).then(response => {
            // console.log('metadata', response);
            return response.result;
        }).catch(reason => {
            return null;
        });
    }

    async function updateListFile(localModifiedTime, ondownload, onupload) {
        var listFile;
        if (!(listFile = await findFile(LIST_FILE_NAME))) {
            listFile = await createFile(LIST_FILE_NAME);
        }

        if (listFile) {
            if (localModifiedTime < new Date((await getMetadata(listFile.id)).modifiedTime).getTime()) {
                ondownload(await getFileContent(listFile.id));
            } else {
                await updateFileContent(listFile.id, onupload());
            }
        } else {
            console.error('cannot sync file');
        }
    }

    function initSync() {
        const script = document.createElement('script');
        script.setAttribute('src', 'https://apis.google.com/js/api.js');
        document.body.appendChild(script);
        script.addEventListener('load', () => {
            gapi.load("client:auth2", function () {
                gapi.auth2.init({
                    client_id: CLIENT_ID
                });
                gapi.auth2.getAuthInstance().isSignedIn.listen(function (e) {
                    if (e) {
                        loadClient();
                        console.log('signedIn');
                        google_search_block_button_auth.style.displey = 'none';
                    } else {
                        google_search_block_button_auth.style.displey = 'block';
                        google_search_block_button_auth.addEventListener('click', authenticate);
                    }
                });
            });
        });
    }

    function doUpdateListFile() {
        updateListFile(parseInt(GM_getValue('modifiedTime', '0')), list_str => {
            setDomains(list_str.split('\n'));
            block = getDomains();
            GM_setValue('modifiedTime', Date.now().toString());
        }, () => {
            return getDomains();
        });
    }

    // end sync

})();