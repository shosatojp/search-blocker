# Search Blocker

## Supported Sites

- Google
  - all domains listed in https://www.google.com/supported_domains
- Bing
  - bing.com
- Yahoo!
  - yahoo.com
- Yahoo! Japan
  - yahoo.co.jp

## Get Started

1. Install Tampermonkey on your browser
    - Chrome: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
    - Firefox: https://addons.mozilla.org/ja/firefox/addon/tampermonkey/
2. Click this URL to install script.
   - [search-blocker.user.js](https://github.com/shosatojp/search-blocker/releases/latest/download/search-blocker.user.js)

## Rule Syntax

```sh
# this is comment

foo.example.com

# also blocks foo.example.com
example.com

# block if 'foobar' appears in title
$intitle('foobar')

# mixed
example.com$intitle('foobar')
```

## Development

```sh
python tools/tampermonkey.py header > tampermonkey/header.js

npm run build

python tools/tampermonkey.py wrapper --path dist/main.user.js > tampermonkey/wrapper.user.js
```
