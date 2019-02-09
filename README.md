# Google Search Blocker
Google Search Blocker blocks sites you don't want to see in google results. You can use this script not only on google.com but bing.com and yahoo.co.jp. This script is also available on mobile (Android Firefox (changing useragent to Android Chrome is recommended.)).

## Get Started

### 1.Install Tampermonkey on your browser
Chrome:
https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo  
Firefox:
https://addons.mozilla.org/ja/firefox/addon/tampermonkey/
### 2.Click this URL to install script.
https://github.com/shosatojp/google_search_blocker/raw/master/google_search_blocker.user.js?

## Edit Quickly On Google Search Result Page
![](https://github.com/ShoSatoJp/google_search_blocker/raw/master/README/label3.png)  
You can use original domain or regex with prefix '#'.

## Auto Block Level Selector
![](https://github.com/ShoSatoJp/google_search_blocker/raw/master/README/block2.png)  
You only need to click button to block domain.



# Available Environments

| OS      | Browser  |     | Sites                                            |
| ------- | -------- | --- | ------------------------------------------------ |
| Windows | Chrome   | O   | google.com, google.co.jp, bing.com, yahoo.co.jp  |
|         | Firefox  | O   | google.com, google.co.jp, bing.com*, yahoo.co.jp |
|         | Edge     | O   | google.com, google.co.jp, bing.com*, yahoo.co.jp |
|         | Opera    | X   |                                                  |
|         | Vivaldi  | O   | google.com, google.co.jp, bing.com*, yahoo.co.jp |
|         | Waterfox | O   | google.com, google.co.jp, bing.com*, yahoo.co.jp |
|         | Sleipnir | O   | google.com, google.co.jp, bing.com*, yahoo.co.jp |
| Android | Firefox  | O   | google.com, google.co.jp, bing.com, yahoo.co.jp  |

## * Why this script cannot sync in bing.com by itself:
This script use `document.body.appendChild` to load Google API. bing.com overrides `Element.prototype.appendChild` at html sctipt tag, and because browser extensions will be injected async, this script cannot copy original and use `appendChild` properly. Nevertheless, you want to use sync in bing.com, you have to add this line to uBlockOrigin's "my filter".

#### Add this to "my filter" of uBlockOrigin.
<!-- > www.bing.com##script:contains(Element.prototype.appendChild)   -->
> `||www.bing.com/search$inline-script  `