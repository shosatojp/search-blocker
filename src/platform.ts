export type Platform = 'tampermonkey' | 'chrome-extension';

declare const GM_info: object;
declare const chrome: object;

export const detectPlatform = (): Platform => {
    if (typeof GM_info !== 'undefined') {
        return 'tampermonkey';
    }

    if (typeof chrome !== 'undefined') {
        return 'chrome-extension';
    }

    throw new Error('Unsupported platform');
};
