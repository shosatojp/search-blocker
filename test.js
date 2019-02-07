// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match https://www.google.co.jp/search?*
// @match https://www.google.com/search?*
// ==/UserScript==

(function () {
    'use strict';
    const src=`
        (function(records,callback){
            records = records.filter(x => {
                return x.target.className === 'g' && x.addedNodes.length;
            });
            records.forEach(x => {
                x.addedNodes.forEach(b => {
                    if (b.tagName === 'DIV')callback(x.target.parentElement);
                });
            });
        })
    `;

    const fn=eval(src);
    const observer_ = new MutationObserver(function (records) {
        fn(records,(element)=>{
            element.style.display = 'none';
        });
    });
    observer_.observe(document, {
        attributes: true,
        childList: true,
        characterData: true,
        attributeFilter: [],
        subtree: true
    });

})();