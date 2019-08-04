// ==UserScript==
// @name         Google Search Blocker Tools
// @namespace    https://github.com/shosatojp/google_search_blocker/raw/master/google_search_blocker_tools.user.js
// @homepage     https://github.com/shosatojp/google_search_blocker
// @version      0.1.1
// @description  tools for Google Search Blocker. This script must run after the main script. Google Search Blocker version 0.13.0 or higher is needed.
// @author       Sho Sato
// @match        *://*/*
// @resource     languages        ./languages.json?
// @resource     add_this_site    ./add_this_site.html?
// @updateURL    https://github.com/shosatojp/google_search_blocker/raw/master/google_search_blocker_tools.user.js?
// @downloadURL  https://github.com/shosatojp/google_search_blocker/raw/master/google_search_blocker_tools.user.js?
// @grant        GM_registerMenuCommand
// @grant        GM_getResourceText
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @noframes
// ==/UserScript==


(function () {
    const LANGUAGE = (window.navigator.languages && window.navigator.languages[0]) ||
        window.navigator.language ||
        window.navigator.userLanguage ||
        window.navigator.browserLanguage;
    const LOCAL_STRING = JSON.parse(GM_getResourceText('languages'))
        .filter(x => ~x.language.indexOf(LANGUAGE.toLowerCase()) || ~x.language.indexOf('en'))[0].ui;
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

    const R = {};

    const StoredRules = (function () {
        const StoredRules = {};
        StoredRules.add = function (src) {
            const rules = StoredRules.get();
            if (!~rules.indexOf(src)) rules.push(src);
            StoredRules.set(rules);
        };
        StoredRules.get = function () {
            return GM_getValue('rules', []);
        };
        StoredRules.set = function (list) {
            GM_setValue('rules', list);
        };
        return StoredRules;
    })();

    function is_search_site() {
        return (~['www.google.com', 'www.google.co.jp', 'www.bing.com'].indexOf(location.host) && location.pathname.startsWith('/search')) ||
            (location.host === 'search.yahoo.co.jp');
    }

    if (is_search_site()) {
        const export_rules = StoredRules.get();
        if (export_rules.length && unsafeWindow.google_search_blocker_import) {
            if (unsafeWindow.google_search_blocker_import(export_rules)) {
                console.log(`%cexported ${export_rules.length} rules`, 'color:#9C27B0;');
                StoredRules.set([]);
            } else {
                console.log(`%cfailed to export rules`, 'color:#9C27B0;');
            }
        }
    } else {
        GM_registerMenuCommand(LOCAL_STRING.addthissite, function () {
            if (!document.querySelector('#google_search_blocker_tools_container')) {
                R.wrapper = document.createElement('div');
                R.wrapper.innerHTML = TextResource.get('add_this_site');
                Object.assign(R, {
                    add_rule: R.wrapper.querySelector('#google_search_blocker_tools_button_add_rule'),
                    rule: R.wrapper.querySelector('#google_search_blocker_tools_rule'),
                    container: R.wrapper.querySelector('#google_search_blocker_tools_container'),
                    close: R.wrapper.querySelector('#google_search_blocker_tools_button_close'),
                    inner: R.wrapper.querySelector('#google_search_blocker_tools_inner'),
                });
                R.add_rule.addEventListener('click', function () {
                    if (R.rule.value) {
                        StoredRules.add(R.rule.value);
                        R.container.style.display = 'none';
                        R.rule.value = '';
                    } else {
                        alert(LOCAL_STRING.ruleisempty);
                    }
                });
                R.close.addEventListener('click', function () {
                    R.container.style.display = 'none';
                });
                R.inner.addEventListener('click', function (e) {
                    e.stopPropagation();
                });
                R.container.addEventListener('click', function () {
                    R.container.style.display = 'none';
                });
                document.body.appendChild(R.wrapper);
            }
            R.container.style.display = 'flex';
            R.rule.value = location.host;
        });
    }
})();