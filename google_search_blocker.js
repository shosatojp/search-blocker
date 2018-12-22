// ==UserScript==
// @name         Google Search Block
// @namespace    http://tampermonkey.net/
// @version      0.9.8
// @description  block KUSO sites from google search results!
// @author       ShoSato
// @match https://www.google.co.jp/*
// @match https://www.google.com/*
// @match https://www.bing.com/*
// @match https://search.yahoo.co.jp/*
// @updateURL https://www.dropbox.com/s/9m9ewftcnc3y8gi/google_search_block.js?dl=1
// @downloadURL https://www.dropbox.com/s/9m9ewftcnc3y8gi/google_search_block.js?dl=1
// @resource block_sites https://www.dropbox.com/s/e79sm2ysjr5tnsq/block_sites.txt?dl=1
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_getResourceText
// ==/UserScript==

(function () {
    'use strict';
    class DOMBuilder {
        static build(dom = {
            tag: '',
            text: '',
            class: '',
            id: '',
            style: {},
            events: {},
            attrs: [{
                name: '',
                value: '',
            }],
            child: [],
            props: {},
        }) {
            var top;
            if (typeof dom === 'string' || dom instanceof String) {
                top = document.createTextNode(dom);
            } else {
                if (dom.tag === 'text') {
                    top = document.createTextNode(dom.text);
                } else {
                    top = document.createElement(dom.tag);
                }
                if (dom.class)
                    top.className = dom.class;
                if (dom.id)
                    top.id = dom.id;
                if (dom.attrs)
                    for (const key in dom.attrs) {
                        if (dom.attrs.hasOwnProperty(key)) {
                            top.setAttribute(key, dom.attrs[key]);
                        }
                    }
                if (dom.events) {
                    for (const key in dom.events) {
                        if (dom.events.hasOwnProperty(key)) {
                            top.addEventListener(key, dom.events[key]);
                        }
                    }
                }
                if (dom.style) {
                    for (const key in dom.style) {
                        if (dom.style.hasOwnProperty(key)) {
                            top.style[key] = dom.style[key];
                        }
                    }
                }
                if (dom.props) {
                    for (const key in dom.props) {
                        if (dom.props.hasOwnProperty(key)) {
                            top[key] = dom.props[key];
                        }
                    }
                }
                if (dom.text) {
                    var text = document.createTextNode(dom.text);
                    top.appendChild(text);
                }
                if (dom.child) {
                    dom.child.forEach(e => {
                        top.appendChild(DOMBuilder.build(e));
                    });
                }
            }
            return top;
        }
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

    function removeAllDomain() {
        GM_setValue('url', '');
        block = getDomains()
        google_search_block();
    }

    function updateLabel(count, list) {
        google_search_block_count.textContent = count;
        showList(list);
    }

    function showLabel() {
        result_container.appendChild(DOMBuilder.build({
            tag: 'style',
            text: '.google_search_block_container{box-shadow:none;border:1px solid #dfe1e5;border-radius:8px;margin-left:-20px;margin-right:-20px;position:relative}#google_search_block_header{margin:10px;font-size:medium;}.google_search_block_button{white-space:nowrap;display:inline-block;background-color:#fff;text-align:center;font-size:14px;color:#202124;border-radius:10px;border:1px solid #DFE1E5;padding:7px 10px;cursor:pointer;margin:5px}#google_search_block_buttons{display:flex;justify-content:flex-end;padding:0 10px 10px}.google_search_block_domain{margin:10px;cursor:pointer}.google_search_block_hr{border-top:#DFE1E5 1px solid;margin:10px 0}#google_search_block_domains{margin:10px}'
        }));
        result_container.appendChild(DOMBuilder.build({
            tag: 'div',
            class: selector.container_class,
            id: 'google_search_block',
            style: {
                'padding': '10px',
                'background': '#fff',
                'margin-bottom': '20px',
                'margin-top': '10px',
            },
            child: [{
                    tag: 'div',
                    id: 'google_search_block_header',
                    style: {
                        display: 'flex',
                        'justify-content': 'space-between',
                    },
                    child: [{
                        tag: 'div',
                        child: [{
                            tag: 'b',
                            text: '検索結果から'
                        }, {
                            tag: 'b',
                            id: 'google_search_block_count',
                            text: 0
                        }, {
                            tag: 'b',
                            text: '件除外しました'
                        }, ]
                    }, {
                        tag: 'code',
                        id: 'google_search_block_info'
                    }, ]
                }, {
                    tag: 'div',
                    class: 'google_search_block_hr'
                }, {
                    tag: 'div',
                    id: 'google_search_block_contents',
                    child: [{
                            tag: 'div',
                            text: '',
                            id: 'google_search_block_blocked'
                        }, {
                            tag: 'div',
                            class: 'google_search_block_hr'
                        }, {
                            tag: 'textarea',
                            id: 'google_search_block_textarea_domains',
                            style: {
                                resize: 'vertical',
                                height: '200px',
                                width: '100%',
                                'font-family': 'monospace',
                                'font-size': 'medium'
                            },
                            attrs: {
                                'spellcheck': false,
                            },
                            props: {
                                'disabled': true,
                            }
                        }, {
                            tag: 'div',
                            id: 'google_search_block_buttons',
                            child: [{
                                    tag: 'button',
                                    id: 'google_search_block_button_complete',
                                    class: 'google_search_block_button',
                                    text: '完了',
                                    events: {
                                        'click': function () {
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
                                        }
                                    },
                                },
                                {
                                    tag: 'button',
                                    id: 'google_search_block_button_edit',
                                    class: 'google_search_block_button',
                                    text: '編集',
                                    events: {
                                        'click': function () {
                                            google_search_block_textarea_domains.disabled = false;
                                        }
                                    },
                                }
                            ]
                        },
                        {
                            tag: 'div',
                            class: 'google_search_block_hr'
                        }
                    ],
                    style: {
                        'display': 'none'
                    }
                },
                {
                    tag: 'div',
                    id: 'google_search_block_buttons',
                    child: [{
                        tag: 'button',
                        id: 'google_search_block_button_show',
                        class: 'google_search_block_button',
                        text: '再表示',
                        events: {
                            'click': function () {
                                document.querySelectorAll(selector.first).forEach(e => e.style.display = 'block');
                                google_search_block_button_reblock.style.display = 'block';
                                google_search_block_button_show.style.display = 'none';
                            }
                        }
                    }, {
                        tag: 'button',
                        id: 'google_search_block_button_reblock',
                        class: 'google_search_block_button',
                        text: 'ブロック',
                        style: {
                            'display': 'none',
                        },
                        events: {
                            'click': function () {
                                google_search_block();
                                google_search_block_button_reblock.style.display = 'none';
                                google_search_block_button_show.style.display = 'block';
                            }
                        }
                    }, {
                        tag: 'button',
                        id: 'google_search_block_button_hidelist',
                        class: 'google_search_block_button',
                        text: 'リストを隠す',
                        style: {
                            'display': 'none'
                        },
                        events: {
                            'click': function () {
                                google_search_block_button_showlist.style.display = 'block';
                                google_search_block_button_hidelist.style.display = 'none';
                                google_search_block_contents.style.display = 'none';
                            }
                        }
                    }, {
                        tag: 'button',
                        id: 'google_search_block_button_showlist',
                        class: 'google_search_block_button',
                        text: '除外リスト',
                        style: {
                            'display': 'block'
                        },
                        events: {
                            'click': function () {
                                google_search_block_button_showlist.style.display = 'none';
                                google_search_block_button_hidelist.style.display = 'block';
                                google_search_block_contents.style.display = 'block';
                                showList(getDomains());
                            }
                        }
                    }]
                }
            ]
        }));
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
        let a = parent.querySelector('.google_search_block_blockui');
        if (a) a.remove();
        let ui = DOMBuilder.build({
            tag: 'div',
            class: 'google_search_block_blockui',
            style: {
                width: '100%',
            },
            child: [{
                tag: 'div',
                class: 'google_search_block_hr'
            }, {
                tag: 'div',
                id: 'google_search_block_blockui_contents',
                style: {
                    margin: '10px',
                    padding: '10px',
                    'overflow-x': 'auto',
                    display: 'flex',
                    'overflow-scrolling': 'touch',
                    'webkit-overflow-scrolling': 'touch'
                },
                // child: [{
                //     tag: 'span',
                //     class: 'google_search_block_button',
                //     style: {
                //         display: 'inline',
                //     },
                //     child: [{
                //         tag: 'code',
                //         text: '閉じる'
                //     }],
                //     events: {
                //         click: function () {
                //             ui.remove();
                //         }
                //     }
                // }]
            }]
        });
        getCandidate(target_url).forEach(e => {
            ui.querySelector('#google_search_block_blockui_contents').appendChild(DOMBuilder.build({
                tag: 'span',
                class: 'google_search_block_button',
                attrs: {
                    url: e.regex,
                },
                child: [{
                    tag: 'code',
                    text: e.alias
                }],
                style: {
                    display: 'inline',
                },
                events: {
                    click: function () {
                        const url = this.getAttribute('url');
                        addDomain(url, false);
                        ui.remove();
                    }
                }
            }))
        });
        parent.appendChild(ui);
    }

    function showButton(parent, target_url) {
        var label = parent.querySelector('.google_search_block_buttons');
        if (!label) {
            const e = DOMBuilder.build({
                tag: 'div',
                style: {
                    'display': 'flex',
                    'justifyContent': 'flex-end'
                },
                class: 'google_search_block_buttons',
                child: [{
                    tag: 'a',
                    text: '除外',
                    attrs: {
                        'url': target_url,
                    },
                    class: 'google_search_block_button_openui',
                    events: {
                        'click': function () {
                            let url = this.getAttribute('url');
                            showBlockUI(parent, url);
                            this.style.display = 'none';
                            parent.querySelector('.google_search_block_button_closeui').style.display = 'block';
                        }
                    },
                    style: {
                        'marginRight': '10px',
                        'marginBottom': '5px',
                        'cursor': 'pointer',
                    }
                }, {
                    tag: 'a',
                    text: '閉じる',
                    class: 'google_search_block_button_closeui',
                    events: {
                        'click': function () {
                            parent.querySelector('.google_search_block_button_openui').style.display = 'block';
                            this.style.display = 'none';
                            parent.querySelector('.google_search_block_blockui').remove();
                        }
                    },
                    style: {
                        'marginRight': '10px',
                        'marginBottom': '5px',
                        'cursor': 'pointer',
                        'display': 'none'
                    }
                }]
            });
            parent.appendChild(e);
        }
    }

    function google_search_block() {
        const start = performance.now();
        count = 0;
        let blocked = [];
        document.querySelectorAll(selector.first).forEach(e => {
            const link = e.querySelector(selector.second);
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
        while (google_search_block_blocked.firstChild) google_search_block_blocked.removeChild(google_search_block_blocked.firstChild);
        distinct(blocked).sort().forEach(e => {
            google_search_block_blocked.appendChild(DOMBuilder.build({
                tag: 'span',
                class: 'google_search_block_button',
                attrs: {
                    domain: e,
                },
                child: [{
                    tag: 'code',
                    text: e
                }],
                events: {
                    click: function () {
                        var domain = this.getAttribute('domain');
                        removeDomain(domain);
                    }
                }
            }));
        });
        updateLabel(count, getDomains());
        google_search_block_info.textContent = `${Math.floor((performance.now() - start)*10)/10}ms ${block.length}個`;
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
    const settings = [{
        "environment": "pc",
        "first": "#search .g",
        "second": ".r>a",
        "container_class": "google_search_block_container",
        "result_container": '#search'
    }, {
        "environment": "mobile",
        "first": ".xpd",
        "second": "a",
        "container_class": "mnr-c",
        "result_container": '#main'
    }, {
        "environment": "bing_pc",
        "first": ".b_algo",
        "second": "a",
        "container_class": "google_search_block_container",
        "result_container": '#b_results'
    }, {
        "environment": "bing_mobile",
        "first": ".b_algo",
        "second": "a",
        "container_class": "b_algo",
        "result_container": '#b_results'
    }, {
        "environment": "yahoo_pc",
        "first": ".w",
        "second": "a",
        "container_class": "google_search_block_container",
        "result_container": '#WS2m'
    }, {
        "environment": "yahoo_mobile",
        "first": ".sw-CardBase",
        "second": "a",
        "container_class": "sw-CardBase",
        "result_container": '#contentsInner'
    }];
    var selector;
    settings.forEach(e => {
        if (e.environment === environment) {
            selector = e;
        }
    });
    const result_container = document.querySelector(selector.result_container);
    if (!result_container) return;

    if (environment === 'mobile') {
        document.querySelectorAll('h3>a').forEach(e => {
            e.addEventListener('click', function () {
                count = 0;
                for (let i = 1; i <= 10; i++) {
                    setTimeout(() => {
                        let len = document.querySelectorAll('.xpd');
                        if (len != xpdcount) {
                            xpdcount = len;
                            google_search_block();
                        }
                    }, i * 500);
                }
            });
        });
    }
    showLabel();
    const google_search_block_label = document.querySelector('#google_search_block');
    const google_search_block_button_showlist = google_search_block_label.querySelector('#google_search_block_button_showlist');
    const google_search_block_count = google_search_block_label.querySelector('#google_search_block_count');
    const google_search_block_button_reblock = google_search_block_label.querySelector('#google_search_block_button_reblock');
    const google_search_block_button_show = google_search_block_label.querySelector('#google_search_block_button_show');
    const google_search_block_button_hidelist = google_search_block_label.querySelector('#google_search_block_button_hidelist');
    const google_search_block_contents = google_search_block_label.querySelector('#google_search_block_contents');
    const google_search_block_textarea_domains = google_search_block_label.querySelector('#google_search_block_textarea_domains');
    const google_search_block_blocked = google_search_block_label.querySelector('#google_search_block_blocked');
    const google_search_block_info = google_search_block_label.querySelector('#google_search_block_info');
    google_search_block();
    console.log(Date.now() - start);
})();
