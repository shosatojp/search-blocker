const url = 'https://www.google.com/search?';

function parseUrlParam(url) {
    const result = {};
    new URL(url).search.substring(1).split('&').forEach(e => {
        const pair = e.split('=');
        if (pair.length === 2) {
            result[pair[0]] = pair[1].length ? pair[1] : null;
        }
    });
    return result;
}

console.log(parseUrlParam(url));