import argparse
import requests
import os
import json

TM_HEADER_TEMPLATE = """\
// ==UserScript==
// @name         Search Blocker
// @namespace    https://github.com/shosatojp/search-blocker
// @homepage     https://github.com/shosatojp/search-blocker
// @version      process.env.VERSION
// @description  Block undesired sites from google search results!
// @author       Sho Sato
{}
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @noframes
// ==/UserScript==
"""

TM_WRAPPER_TEMPLATE = """\
// ==UserScript==
// @name         Search Blocker (Wrapper)
// @namespace    https://github.com/shosatojp/search-blocker
// @version      0.1
// @description  wrapper for debugging tampermonkey user script
// @author       You
// @require      file://{}
{}
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @noframes
// ==/UserScript==
"""


def generateMatchUrlGoogle():
    res = requests.get("https://www.google.com/supported_domains")
    domains = res.text.strip().split("\n")

    for domain in domains:
        yield f"*://www{domain}/search?*"

def getMatchUrls():
    # https://developer.chrome.com/docs/extensions/mv3/match_patterns/
    return [
        "*://www.bing.com/search?*",
        "*://search.yahoo.co.jp/*",
        "*://search.yahoo.com/*",
        "*://duckduckgo.com/*",
        *generateMatchUrlGoogle(),
    ]

def generateTamperMonkeyMatchSection():
    matches = getMatchUrls()
    lines = []
    for matchUrl in matches:
        lines.append("// @match\t" + matchUrl)

    return "\n".join(lines)


def generateTamperMonkeyHeader():
    match_section = generateTamperMonkeyMatchSection()

    return TM_HEADER_TEMPLATE.format(match_section)


def generateTamperMonkeyWrapper(script_path: str):
    match_section = generateTamperMonkeyMatchSection()

    return TM_WRAPPER_TEMPLATE.format(script_path, match_section)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--path")
    parser.add_argument("command", choices=["header", "wrapper", "matches"])
    args = parser.parse_args()

    if args.command == "header":
        print(generateTamperMonkeyHeader())
    elif args.command == "wrapper":
        if not args.path:
            raise RuntimeError("--path is required")
        print(generateTamperMonkeyWrapper(os.path.abspath(args.path)))
    elif args.command == "matches":
        matches = getMatchUrls()
        print(json.dumps(matches, ensure_ascii=False, indent=4))
