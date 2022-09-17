# Search Blocker

## Supported sites

- Google
  - all domains listed in https://www.google.com/supported_domains
- Bing
  - bing.com
- Yahoo!
  - yahoo.com
- Yahoo! Japan
  - yahoo.co.jp

## Development

```sh
python tools/tampermonkey.py header > tampermonkey/header.js

npm run build

python tools/tampermonkey.py wrapper --path dist/main.user.js > tampermonkey/wrapper.user.js
```
