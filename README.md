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

<!-- ## Windows
Chrome, Firefox, Edge, Vivaldi, Waterfox, Sleipnir  
*Opera is not available.
## Android
Firefox
## Mac -->

| OS      | Browser  | Domain       | Block | Sync |
| ------- | -------- | ------------ | ----- | ---- |
| Windows | Chrome   | google.com   | O     | O    |
| Windows | Chrome   | google.co.jp | O     | O    |
| Windows | Chrome   | bing.com     | O     | O    |
| Windows | Chrome   | yahoo.co.jp  | O     | O    |
| Windows | Firefox  | google.com   | O     | O    |
| Windows | Firefox  | google.co.jp | O     | O    |
| Windows | Firefox  | bing.com     | O     | O*   |
| Windows | Firefox  | yahoo.co.jp  | O     | O    |
| Windows | Edge     | google.com   | O     | O    |
| Windows | Edge     | google.co.jp | O     | O    |
| Windows | Edge     | bing.com     | O     | O*   |
| Windows | Edge     | yahoo.co.jp  | O     | O    |
| Windows | Opera    | any sites    | X     | X    |
| Windows | Vivaldi  | google.com   | O     | O    |
| Windows | Vivaldi  | google.co.jp | O     | O    |
| Windows | Vivaldi  | bing.com     | O     | O*    |
| Windows | Vivaldi  | yahoo.co.jp  | O     | O    |
| Windows | Waterfox | google.com   | O     | O    |
| Windows | Waterfox | google.co.jp | O     | O    |
| Windows | Waterfox | bing.com     | O     | O*    |
| Windows | Waterfox | yahoo.co.jp  | O     | O    |
| Windows | Sleipnir | google.com   | O     | O    |
| Windows | Sleipnir | google.co.jp | O     | O    |
| Windows | Sleipnir | bing.com     | O     | O*    |
| Windows | Sleipnir | yahoo.co.jp  | O     | O    |
| Android | Firefox  | google.com   | O     | O    |
| Android | Firefox  | google.co.jp | O     | O    |
| Android | Firefox  | bing.com     | O     | O    |
| Android | Firefox  | yahoo.co.jp  | O     | O    |

## * Why this script cannot sync in bing.com by itself:
This script use `document.body.appendChild` to load Google API. bing.com overrides `Element.prototype.appendChild` at html sctipt tag, and because browser extensions will be injected async, this script cannot copy original and use `appendChild` properly. Nevertheless, you want to use sync in bing.com, you have to add this line to uBlockOrigin's "my filter".

#### Add this to "my filter" of uBlockOrigin.
<!-- > www.bing.com##script:contains(Element.prototype.appendChild)   -->
> `||www.bing.com/search$inline-script  `