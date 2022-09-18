export type Platform = 'tampermonkey';

declare const GM_info: object;

export const detectPlatform = (): Platform => {
    if (typeof GM_info !== 'undefined') {
        return 'tampermonkey';
    }

    throw new Error('Unsupported platform');
};
