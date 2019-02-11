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

### Edit Quickly On Google Search Result Page
![](./README/000.png)  

You can use original domain or regex with prefix '#'.

### Auto Block Level Selector
![](./README/001.png)  
You only need to click button to block domain.

## How to write rules
| Block by:       | Rule                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Domain          | `example.com`<br>`foo.example.com`                                                                                        |
| PDF             | `#\.pdf`                                                                                          |
| IDN             | `#https?://xn--[0-9a-z.]+/`                                                                       |
| Title           | `$intitle('w3schools')`                                                                           |
| Content         | `$inbody('w3schools')`                                                                            |
| Title + Content | `$intext('foo')`                                                                                  |
| URL             | `$inurl('/wp-content/uploads/')`                                                                  |
| Script          | `$script('~$.indexOf("bar")')`                                                                    |
| Regex           | `$intitle('foo','')`<br>`$inbody('foo','i')`<br>`$intext('w3schools','m')`<br>`$inurl('w3schools','igmy')` |

`#...` is alias of `$inurl(...,'')`


## Sync
You need google account to sync block list. This script sync using your google drive storage. After sync a file named `GoogleSearchBlocker.txt` will be created at the root of your storage, but you can move this file anywhere excludes trash box.

## Available Environments

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
| OSX | (probably)  | O   | Sorry, I don't have mac.  |

### * Why this script cannot sync in bing.com by itself:
This script use `document.body.appendChild` to load Google API. bing.com overrides `Element.prototype.appendChild` at html sctipt tag, and because browser extensions will be injected async, this script cannot copy original and use `appendChild` properly. Nevertheless, you want to use sync in bing.com, you have to add this line to uBlockOrigin's "my filter".

#### Add this to "my filter" of uBlockOrigin.
<!-- > www.bing.com##script:contains(Element.prototype.appendChild)   -->
> `||www.bing.com/search$inline-script  `


## Available on mobile too (Android Firefox)
![](./README/002.png)  
![](./README/003.png)  
